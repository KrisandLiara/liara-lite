#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');
const http = require('http');

let frontendProcess = null;
let backendProcess = null;
let isShuttingDown = false;

// ANSI color codes for simpler coloring
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  gray: '\x1b[90m'
};

// Helper function to format log prefix
const getPrefix = (service) => {
  if (service === 'frontend') {
    return `${colors.magenta}${colors.bright} FRONTEND ${colors.reset}`;
  }
  return `${colors.yellow}${colors.bright} BACKEND  ${colors.reset}`;
};

// Helper function to kill a process
async function killProcess(proc, name) {
  if (!proc || proc.killed) return;
  
  console.log(`${colors.gray}Stopping ${name}...${colors.reset}`);
  try {
    if (process.platform === "win32") {
      await new Promise((resolve) => {
        const kill = spawn("taskkill", ["/pid", proc.pid, '/f', '/t'], { 
          stdio: 'pipe',
          shell: true 
        });
        kill.on('close', resolve);
      });
    } else {
      proc.kill('SIGTERM');
      await new Promise(resolve => {
        const timeout = setTimeout(() => {
          proc.kill('SIGKILL');
          resolve();
        }, 2000);
        proc.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  } catch (err) {
    console.log(`${colors.yellow}Warning: Error while stopping ${name}: ${err.message}${colors.reset}`);
  }
}

function startBackend() {
  console.log(`${colors.yellow}🚀 Starting backend...${colors.reset}`);
  
  backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: './liara-backend',
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1'
    }
  });

  const prefix = getPrefix('backend');
  
  backendProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      // Filter and format backend logs
      if (line.includes('restarting due to changes')) {
        console.log(prefix + `${colors.green}🔄 Backend restarting...${colors.reset}`);
      } else if (line.includes('[nodemon]')) {
        // Skip nodemon startup messages
      } else {
        console.log(prefix + `${colors.yellow}${line}${colors.reset}`);
      }
    });
  });

  backendProcess.stderr.on('data', (data) => {
    console.log(prefix + `${colors.red}${data.toString()}${colors.reset}`);
  });

  backendProcess.on('close', (code) => {
    if (!isShuttingDown) {
      console.log(`${colors.yellow}Backend process exited with code ${code}. Restarting...${colors.reset}`);
      startBackend();
    }
  });
}

function startFrontend() {
  console.log(`${colors.magenta}🚀 Starting frontend...${colors.reset}`);
  
  frontendProcess = spawn('npm', ['run', 'vite'], {
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

  const prefix = getPrefix('frontend');
  let lastHmrTime = 0;

  frontendProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      // Filter and format frontend logs
      if (line.includes('hmr update')) {
        const currentTime = Date.now();
        if (currentTime - lastHmrTime > 500) { // Throttle HMR messages
          const updatedFile = line.split('hmr update').pop()?.trim();
          if (updatedFile) {
            console.log(prefix + `${colors.green}🔥 Hot-reload: ${colors.bright}${updatedFile}${colors.reset}`);
          }
          lastHmrTime = currentTime;
        }
      } else if (line.includes('page reload') || line.includes('full reload')) {
        console.log(prefix + `${colors.yellow}🔄 Full page reload triggered${colors.reset}`);
      } else if (!line.includes('ready in') && !line.includes('Local:') && !line.includes('Network:')) {
        console.log(prefix + `${colors.magenta}${line}${colors.reset}`);
      }
    });
  });

  frontendProcess.stderr.on('data', (data) => {
    console.log(prefix + `${colors.red}${data.toString()}${colors.reset}`);
  });

  frontendProcess.on('close', (code) => {
    if (!isShuttingDown) {
      console.log(`${colors.magenta}Frontend process exited with code ${code}. Restarting...${colors.reset}`);
      startFrontend();
    }
  });
}

async function restartAll() {
  console.log(`\n${colors.cyan}🔄 Restarting all services...${colors.reset}`);
  
  // Kill both processes
  await Promise.all([
    killProcess(frontendProcess, 'frontend'),
    killProcess(backendProcess, 'backend')
  ]);
  
  // Wait for processes to fully stop
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Start backend first
  startBackend();
  
  // Wait a bit before starting frontend
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start frontend
  startFrontend();
  
  console.log(`${colors.green}✅ All services restarted!${colors.reset}`);
}

// Handle restart command
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', async (line) => {
  if (line.trim().toLowerCase() === 'r') {
    isShuttingDown = true;
    await restartAll();
    isShuttingDown = false;
  }
});

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log(`\n${colors.yellow}🛑 Shutting down...${colors.reset}`);
  isShuttingDown = true;
  
  await Promise.all([
    killProcess(frontendProcess, 'frontend'),
    killProcess(backendProcess, 'backend')
  ]);
  
  process.exit(0);
});

console.log(`${colors.bright}${colors.cyan}🚀 Frontend + Backend Development Mode${colors.reset}`);
console.log(`${colors.gray}Make sure Supabase is running in another terminal${colors.reset}`);
console.log(`${colors.gray}Press Ctrl+C to exit, r + Enter to restart both services\n${colors.reset}`);

// Check if Supabase is running
async function checkSupabase() {
  console.log(`${colors.cyan}Checking if Supabase is running...${colors.reset}`);
  
  try {
    // Try to fetch the Supabase health check endpoint
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:55421/rest/v1/', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, (res) => {
        resolve(res);
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });

    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ Supabase is running${colors.reset}`);
      return true;
    }
  } catch (error) {
    // Ignore fetch errors
  }

  console.log(`${colors.red}✗ Supabase is not running${colors.reset}`);
  console.log(`${colors.yellow}Please start Supabase in another terminal with:${colors.reset}`);
  console.log(`${colors.bright}supabase start${colors.reset}`);
  return false;
}

// Start services
(async () => {
  if (await checkSupabase()) {
    startBackend();
    setTimeout(() => startFrontend(), 1000); // Start frontend 1s after backend
  } else {
    process.exit(1);
  }
})();