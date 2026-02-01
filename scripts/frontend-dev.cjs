#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');

let frontendProcess = null;
let isShuttingDown = false;

function startFrontend() {
  console.log(chalk.cyan('🚀 Starting frontend...'));
  
  frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      VITE_FORCE_RELOAD: 'true',
      CHOKIDAR_USEPOLLING: 'false',
      CHOKIDAR_INTERVAL: '100',
    }
  });

  frontendProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      // Filter out noisy messages
      if (line.includes('hmr update')) {
        const updatedFile = line.split('hmr update').pop()?.trim();
        if (updatedFile) {
          console.log(chalk.green('🔥 Hot-reload:'), chalk.bold.white(updatedFile));
        }
      } else if (line.includes('page reload') || line.includes('full reload')) {
        console.log(chalk.yellow('🔄 Full page reload triggered'));
      } else if (!line.includes('ready in') && !line.includes('Local:') && !line.includes('Network:')) {
        console.log(line);
      }
    });
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(chalk.red(data.toString()));
  });

  frontendProcess.on('close', (code) => {
    if (!isShuttingDown) {
      console.log(chalk.yellow(`Frontend process exited with code ${code}. Restarting...`));
      startFrontend();
    }
  });
}

// Handle restart command
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  if (line.trim().toLowerCase() === 'r') {
    console.log(chalk.yellow('🔄 Restarting frontend...'));
    if (frontendProcess) {
      isShuttingDown = true;
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", frontendProcess.pid, '/f', '/t']);
      } else {
        frontendProcess.kill();
      }
      setTimeout(() => {
        isShuttingDown = false;
        startFrontend();
      }, 1000);
    }
  }
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Shutting down...'));
  isShuttingDown = true;
  if (frontendProcess) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", frontendProcess.pid, '/f', '/t']);
    } else {
      frontendProcess.kill();
    }
  }
  process.exit(0);
});

console.log(chalk.bold.cyan('🎨 Frontend Development Mode'));
console.log(chalk.gray('Press Ctrl+C to exit, r + Enter to restart\n'));
startFrontend();