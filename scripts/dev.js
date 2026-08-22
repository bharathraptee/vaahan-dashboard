import net from 'net';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function start() {
  const backendPort = await getFreePort();
  console.log(`[dev] Found free port for backend: ${backendPort}`);

  const isWindows = os.platform() === 'win32';
  let pythonCmd = isWindows ? path.join('.venv', 'Scripts', 'python.exe') : path.join('.venv', 'bin', 'python');
  
  if (!fs.existsSync(pythonCmd)) {
      pythonCmd = isWindows ? 'python' : 'python3';
  }

  const backend = spawn(pythonCmd, ['-m', 'uvicorn', 'backend.main:app', '--reload', '--port', backendPort.toString()], {
    stdio: 'inherit',
    shell: true
  });

  const frontendDir = fs.existsSync(path.join(process.cwd(), 'frontend')) ? path.join(process.cwd(), 'frontend') : process.cwd();

  const frontend = spawn('npx', ['vite'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_API_URL: `http://localhost:${backendPort}/api`
    }
  });

  const cleanup = () => {
    backend.kill();
    frontend.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

start();
