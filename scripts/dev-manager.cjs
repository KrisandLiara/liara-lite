#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

// A utility to run a command and wait for it to complete.
function runCommandAndWait(command, args, options) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, options);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" failed with code ${code}`));
      }
    });
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// A new utility to run a command and get its standard output.
function runCommandAndGetOutput(command, args, options) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, options);
    let stdout = '';
    proc.stdout.on('data', (data) => (stdout += data.toString()));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        // Resolve with empty string on error, as the container might just not exist.
        resolve(''); 
      }
    });
    proc.on('error', (err) => reject(err));
  });
}

// A utility to pause execution for a given number of milliseconds.
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldSuppressSupabaseLog(line) {
  const patternsToSuppress = [
    'WARNING (', // Catches all warnings
    'NOTICE (', // Catches all notices
    'WARN: no files matched pattern',
    'Applying migration',
    'Seeding globals from',
    'Initialising schema',
    'Starting containers',
    'Waiting for health checks',
    'service_role key:', // Hide all the keys and URLs
    '✅ Service exited cleanly',
  ];
  return patternsToSuppress.some(pattern => line.includes(pattern));
}

async function main() {
  // Use dynamic import for chalk and ora, which are ESM packages
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  const scriptArgs = process.argv.slice(2);
  const isVerbose = scriptArgs.includes('--full');
  const isNoSupabase = scriptArgs.includes('--no-supabase') || scriptArgs.includes('--app-only');
  const isSupabaseOnly = scriptArgs.includes('--supabase-only');
  const isNoClean = scriptArgs.includes('--no-clean');
  const isStable = scriptArgs.includes('--stable'); // stable = no nodemon (avoid restarts during long enrich runs)

  console.log(chalk.bold.green('🚀 Liara Development Manager - Enhanced Edition'));
  console.log(chalk.gray('   ⚡ Supercharged hot reloading & manual restart capabilities'));
  if (isVerbose) {
    console.log(chalk.gray('🧐 Full log mode enabled. All output will be shown.'));
  }

  if (isSupabaseOnly && isNoSupabase) {
    console.log(chalk.red('❌ Conflicting flags: use either --supabase-only or --no-supabase/--app-only (not both).'));
    process.exit(1);
  }
  
  // --- Step 1: Clean up previous Supabase instance ---
  if (!isNoSupabase && !isNoClean) {
    const cleanupSpinner = ora({ 
      text: chalk.yellow('🧹 Running pre-flight cleanup...'),
      spinner: 'dots' 
    }).start();
    
    try {
      // First, try the standard stop command.
      cleanupSpinner.text = chalk.yellow('🧹 Gracefully stopping Supabase services...');
      await runCommandAndWait('supabase', ['stop', '--no-backup'], { stdio: 'pipe', shell: true });
      cleanupSpinner.succeed(chalk.green('✅ Supabase services stopped.'));

      // Then, forcefully remove any lingering containers to prevent conflicts.
      cleanupSpinner.text = chalk.yellow('🧹 Searching for and removing any zombie containers...');
      cleanupSpinner.start();
      const containerIds = await runCommandAndGetOutput('docker', ['ps', '-a', '-q', '--filter', 'name=supabase_*'], { shell: true });
      
      if (containerIds) {
        await runCommandAndWait('docker', ['rm', '-f', ...containerIds.split('\n')], { stdio: 'pipe', shell: true });
        cleanupSpinner.succeed(chalk.green('✅ Zombie containers forcefully removed.'));
      } else {
        cleanupSpinner.succeed(chalk.green('✅ No zombie containers found.'));
      }
      
      cleanupSpinner.info(chalk.gray('Giving Docker a moment to settle...'));
      await delay(1000); 
    } catch (error) {
      cleanupSpinner.warn(chalk.yellow('Cleanup finished, but some steps may have failed. This is okay if no services were running. Continuing...'));
      // We continue even if it fails.
    }
  } else if (isNoSupabase) {
    console.log(chalk.gray('ℹ️  Supabase management disabled (--no-supabase).'));
  } else if (isNoClean) {
    console.log(chalk.gray('ℹ️  Supabase cleanup disabled (--no-clean).'));
  }

  // --- Step 2: Define and launch services ---
  const services = [
    {
      name: 'supabase',
      command: 'supabase',
      // Windows note: some environments reserve 54309–54408, and Supabase's analytics/logflare
      // container may try to bind within that range (e.g. 54327). Excluding logflare avoids the bind error.
      args: ['start', '-x', 'logflare'],
      cwd: '.',
      color: chalk.cyan,
      prefix: '🐬 SUPABASE',
      prefixColor: chalk.white.bgCyan.bold,
      // The spinner will wait for this specific string before succeeding.
      successString: 'Started supabase local development setup.',
      restartable: false, // Don't allow manual restart of Supabase
    },
    {
      name: 'backend',
      command: 'npm',
      args: isStable ? ['run', 'start'] : ['run', 'dev'],
      cwd: './liara-backend',
      color: chalk.yellow,
      prefix: '⚙️ BACKEND ',
      prefixColor: chalk.black.bgYellow.bold,
      restartable: true,
      hotReload: !isStable,
    },
    {
      name: 'frontend',
      command: 'npm',
      // IMPORTANT:
      // "npm run dev" at repo root runs scripts/dev.cjs, which itself spawns BOTH backend + frontend.
      // When we're already running the backend from this manager, the frontend should be Vite-only
      // to avoid duplicate processes and confusing logs.
      args: ['run', 'vite'],
      cwd: '.',
      color: chalk.magenta,
      prefix: '🎨 FRONTEND',
      prefixColor: chalk.white.bgMagenta.bold,
      restartable: true,
      hotReload: true,
    },
  ];

  // Filter services based on mode flags
  const servicesToStart = services.filter((s) => {
    if (isSupabaseOnly) return s.name === 'supabase';
    if (isNoSupabase) return s.name !== 'supabase';
    return true;
  });

  const childProcesses = new Map(); // Keep track of all spawned processes by name
  let isShuttingDown = false;
  let isRestarting = false;

  // Enhanced service restart function
  async function restartService(serviceName) {
    const service = services.find(s => s.name === serviceName);
    if (!service) {
      console.log(chalk.red(`❌ Service "${serviceName}" not found.`));
      return;
    }

    if (!service.restartable) {
      console.log(chalk.yellow(`⚠️  Service "${serviceName}" is not restartable via manual command.`));
      return;
    }

    console.log(chalk.yellow(`🔄 Restarting ${service.prefix}...`));
    
    // Kill existing process
    const existingProc = childProcesses.get(serviceName);
    if (existingProc && !existingProc.killed) {
      console.log(chalk.gray(`   Stopping existing ${serviceName} process...`));
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", existingProc.pid, '/f', '/t'], { stdio: 'pipe' });
      } else {
        existingProc.kill('SIGTERM');
      }
      await delay(2000); // Give time for cleanup
    }

    // Start new process
    try {
      console.log(chalk.gray(`   Starting new ${serviceName} process...`));
      const newProc = await startService(service, isVerbose);
      childProcesses.set(serviceName, newProc);
      console.log(chalk.green(`✅ ${service.prefix} restarted successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to restart ${service.prefix}: ${error.message}`));
    }
  }

  function startService(service, verbose = false) {
    const { command, args, cwd, color, prefix, prefixColor, successString, hotReload } = service;
    // This function will now return a Promise that resolves when the service is started.
    return new Promise((resolve, reject) => {
      const spinner = ora({
        text: color(`- Launching ${prefix}...`),
        spinner: 'dots',
        color: 'yellow' // Generic spinner color
      }).start();
      
      const proc = spawn(command, args, {
        cwd,
        stdio: 'pipe',
        shell: true,
        env: {
          ...process.env,
          // Enhanced environment variables for better hot reloading
          ...(hotReload && {
            FORCE_COLOR: '1',
            VITE_FORCE_RELOAD: 'true',
            CHOKIDAR_USEPOLLING: 'false',
            CHOKIDAR_INTERVAL: '100',
            WATCHPACK_POLLING: 'false',
          })
        }
      });

      childProcesses.set(service.name, proc); // Add to our map for management

      const styledPrefix = prefixColor(` ${prefix} `);

      // A flag to know if we've moved past the "startup" phase.
      let isStarted = false;
      let lastHmrTime = 0;

      const handleFirstOutput = (data) => {
        if (!isStarted) {
          const line = data.toString();
          // If a success string is defined, wait for it. Otherwise, any output is success.
          if (successString && !line.includes(successString)) {
            return; // Not the success message yet, keep spinner going.
          }
          isStarted = true;
          spinner.succeed(chalk.green(`✅ ${prefix} is running!`));
          resolve(proc); // Resolve the promise once started
        }
      };

      const log = (data) => {
        handleFirstOutput(data);
        let lines = data.toString().split('\n').filter(line => line.trim() !== '');

        // --- Enhanced Frontend HMR Messages ---
        if (service.name === 'frontend') {
          const hmrLines = lines.filter(line => 
            line.includes('hmr update') || 
            line.includes('page reload') || 
            line.includes('full reload') ||
            line.includes('[vite]') ||
            line.includes('✨ optimized dependencies changed')
          );
          
          if (hmrLines.length > 0) {
            const currentTime = Date.now();
            // Throttle HMR messages to avoid spam
            if (currentTime - lastHmrTime > 500) {
              hmrLines.forEach(hmrLine => {
                if (hmrLine.includes('hmr update')) {
                  const updatedFile = hmrLine.split('hmr update').pop()?.trim();
                  if (updatedFile) {
                    // Use process.stderr to avoid interfering with input
                    console.log(
                      styledPrefix,
                      chalk.green('🔥 Hot-reload:'),
                      chalk.bold.white(updatedFile)
                    );
                  }
                } else if (hmrLine.includes('page reload') || hmrLine.includes('full reload')) {
                  console.log(
                    styledPrefix,
                    chalk.yellow('🔄 Full page reload triggered')
                  );
                } else if (hmrLine.includes('✨ optimized dependencies changed')) {
                  console.log(
                    styledPrefix,
                    chalk.blue('⚡ Dependencies optimized - reloading...')
                  );
                }
              });
              lastHmrTime = currentTime;
            }
            // Filter out the original lines to avoid double-logging
            lines = lines.filter(line => !hmrLines.includes(line));
          }
          
          // Filter out repetitive Vite startup messages after restart
          lines = lines.filter(line => 
            !line.includes('ready in') &&
            !line.includes('Local:') &&
            !line.includes('Network:') &&
            !line.includes('use --host')
          );
        }

        // --- Enhanced Backend Hot Reload Messages ---
        if (service.name === 'backend') {
          const restartLines = lines.filter(line => 
            line.includes('restarting') ||
            line.includes('changes detected') ||
            line.includes('nodemon')
          );
          
          if (restartLines.length > 0) {
            restartLines.forEach(restartLine => {
              if (restartLine.includes('restarting')) {
                console.log(
                  styledPrefix,
                  chalk.green('🔄 Backend restarting due to changes...')
                );
              } else if (restartLine.includes('changes detected')) {
                console.log(
                  styledPrefix,
                  chalk.yellow('👀 File changes detected')
                );
              }
            });
            // Filter out the original lines
            lines = lines.filter(line => !restartLines.includes(line));
          }
        }
        // --- End Enhanced Messages ---

        // For supabase, filter logs if not in verbose mode
        if (service.name === 'supabase' && !verbose) {
          lines = lines.filter(line => !shouldSuppressSupabaseLog(line));
        }
        
        // Only log if we have lines to show - use stderr to avoid input interference
        if (lines.length > 0) {
          lines.forEach(line => console.log(styledPrefix, color(line)));
        }
      };

      const logError = (data) => {
        handleFirstOutput(data); // Still treat error output as "started" to unblock the sequence
        let lines = data.toString().split('\n').filter(line => line.trim() !== '');
        // For supabase, filter logs if not in verbose mode
        if (service.name === 'supabase' && !verbose) {
          lines = lines.filter(line => !shouldSuppressSupabaseLog(line));
        }
        if (lines.length === 0) return;
        lines.forEach(line => console.log(styledPrefix, chalk.red.bold(line)));
      };
      
      proc.stdout.on('data', log);
      proc.stderr.on('data', logError);

      proc.on('close', (code) => {
        if (!isStarted) {
          isStarted = true;
          spinner.fail(chalk.red.bold(`❌ ${prefix} exited prematurely.`));
          reject(new Error(`Service ${prefix} exited with code ${code}`));
        }
        const exitMessage = code === 0 
          ? chalk.green('✅ Service exited cleanly.')
          : chalk.red(`❌ Service exited with error code ${code}.`);
        console.log(`${styledPrefix} ${exitMessage}`);
        
        // Only remove from active processes if it's not Supabase (Supabase runs in containers)
        if (service.name !== 'supabase') {
          childProcesses.delete(service.name);
        }
      });

      proc.on('error', (err) => {
        if (!isStarted) {
          isStarted = true;
          spinner.fail(chalk.red.bold(`❌ ${prefix} failed to start!`));
          reject(err);
        }
        console.log(`${styledPrefix} ${chalk.red.bold(`❌ Failed to start service: ${err.message}`)}`);
      });
    });
  }

  console.log(chalk.bold.blue('🚀 Starting all services sequentially...'));
  for (const service of servicesToStart) {
    try {
      const proc = await startService(service, isVerbose);
      childProcesses.set(service.name, proc);
    } catch (error) {
      console.error(chalk.red.bold(`\n💥 Failed to start ${service.name}. Halting startup.`));
      // In case of failure, we should initiate a shutdown of already started services.
      gracefulShutdown('SIGTERM'); 
      return; // Stop the script
    }
  }
  
  console.log(chalk.bold.cyan('\n========================================'));
  console.log(chalk.bold.green('    🎉 All services are up and running!'));
  console.log(chalk.bold.cyan('========================================'));
  if (!isSupabaseOnly) {
    console.log(`\nYour Liara instance is ready. Access the frontend here:`);
    console.log(chalk.underline.blue('http://localhost:8080'));
  }
  
  // Simple keyboard shortcuts
  console.log(chalk.bold.yellow('\n⌨️  Quick Restart:'));
  console.log(chalk.gray('   Ctrl+C       - Shutdown all services'));
  if (!isSupabaseOnly) {
    console.log(chalk.gray('   r + Enter    - Restart frontend & backend only (keeps Supabase running if it is running)'));
  }
  console.log(chalk.gray('   Or just stop and run the command again'));
  console.log(chalk.gray('\n🔥 Enhanced hot reloading is active!'));
  console.log(chalk.gray('💡 If hot reload isn\'t working, try "r + Enter" for a quick restart'));

  // Simple restart function for frontend and backend only
  async function restartFrontendAndBackend() {
    console.log(chalk.cyan('\n🔄 Restarting frontend and backend (keeping Supabase running)...'));
    
    // Enhanced process cleanup
    async function killProcess(proc, name) {
      if (!proc || proc.killed) return;
      
      console.log(chalk.gray(`   Stopping ${name}...`));
      try {
        if (process.platform === "win32") {
          // More robust Windows process killing
          await new Promise((resolve) => {
            const kill = spawn("taskkill", ["/pid", proc.pid, '/f', '/t'], { 
              stdio: 'pipe',
              shell: true 
            });
            kill.on('close', resolve);
          });
        } else {
          proc.kill('SIGTERM');
        }
      } catch (err) {
        console.log(chalk.yellow(`   Warning: Error while stopping ${name}: ${err.message}`));
      }
    }

    // Stop both processes
    await Promise.all([
      killProcess(childProcesses.get('frontend'), 'frontend'),
      killProcess(childProcesses.get('backend'), 'backend')
    ]);
    
    // Clear the processes from our map
    childProcesses.delete('frontend');
    childProcesses.delete('backend');
    
    // Wait for processes to fully stop
    await delay(3000);
    
    // Restart backend first
    try {
      console.log(chalk.gray('   Starting backend...'));
      const backendService = services.find(s => s.name === 'backend');
      const newBackendProc = await startService(backendService, isVerbose);
      childProcesses.set('backend', newBackendProc);
      console.log(chalk.green('   ✅ Backend restarted!'));
    } catch (error) {
      console.error(chalk.red('   ❌ Failed to restart backend:', error.message));
    }
    
    // Then restart frontend
    try {
      console.log(chalk.gray('   Starting frontend...'));
      const frontendService = services.find(s => s.name === 'frontend');
      const newFrontendProc = await startService(frontendService, isVerbose);
      childProcesses.set('frontend', newFrontendProc);
      console.log(chalk.green('   ✅ Frontend restarted!'));
    } catch (error) {
      console.error(chalk.red('   ❌ Failed to restart frontend:', error.message));
    }
    
    console.log(chalk.green('🎉 Frontend and backend restart complete!'));
    console.log(chalk.gray('💡 Type "r + Enter" again if you need another restart'));
  }

  // Input handling (line mode). Raw mode is flaky on Windows and can "lock up" after restarts.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.on('line', async (line) => {
    if (isShuttingDown) return;
    if (isRestarting) return;
    const cmd = String(line || '').trim().toLowerCase();
    if (cmd === 'r') {
      if (isSupabaseOnly) {
        console.log(chalk.gray('ℹ️  Supabase-only mode: restart shortcut is disabled.'));
        return;
      }
      isRestarting = true;
      // Pause readline while we restart so Windows terminals don't get "stuck" after heavy output.
      rl.pause();
      try {
        await restartFrontendAndBackend();
      } finally {
        rl.resume();
        isRestarting = false;
        console.log(chalk.gray('✅ Ready. Type "r" + Enter again to restart.'));
      }
    }
  });

  // --- Step 3: Graceful Shutdown Handler ---
  function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(chalk.bold.yellow(`\n🚨 Received ${signal}. Shutting down all services gracefully...`));
    
    childProcesses.forEach((proc, name) => {
      if (proc && !proc.killed) {
        console.log(chalk.gray(`   Stopping ${name}...`));
        // On Windows, taskkill is more reliable for killing process trees.
        // The /t flag terminates the specified process and any child processes which were started by it.
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", proc.pid, '/f', '/t']);
        } else {
          // On other systems (Linux, macOS), kill the process.
          // The child processes should receive the signal as well.
          proc.kill(signal);
        }
      }
    });
    
    // Give a moment for processes to die before exiting the main script.
    setTimeout(() => {
      console.log(chalk.bold.green('✅ All services have been sent the shutdown signal.'));
      process.exit(0);
    }, 2000);
  }

  process.on('SIGINT', gracefulShutdown); // Catches Ctrl+C
  process.on('SIGTERM', gracefulShutdown);
}

main().catch(error => {
  console.error('A critical error occurred in the dev manager:', error);
  process.exit(1);
});