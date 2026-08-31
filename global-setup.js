// global-setup.js — starts the FastAPI/uvicorn server before tests run
const { spawn } = require('child_process');
const http = require('http');

const PYTHON = 'd:\\webinar\\Webinar\\StudentManagementSystem_demo\\venv\\Scripts\\python.exe';
const CWD    = 'd:\\webinar\\Webinar\\StudentManagementSystem_demo';
const PORT   = 8000;
const MAX_WAIT_MS = 20000;

function isServerUp() {
  return new Promise((resolve) => {
    http.get(`http://localhost:${PORT}/`, (res) => {
      resolve(true);
    }).on('error', () => resolve(false));
  });
}

async function waitForServer(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp()) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

module.exports = async function globalSetup() {
  // If server is already up, nothing to do
  if (await isServerUp()) {
    console.log('[global-setup] Server already running on port', PORT);
    return;
  }

  console.log('[global-setup] Starting uvicorn server...');
  const proc = spawn(PYTHON, ['-m', 'uvicorn', 'app.main:app', '--port', String(PORT)], {
    cwd: CWD,
    detached: false,
    stdio: 'pipe',
  });

  proc.stdout.on('data', d => process.stdout.write('[uvicorn] ' + d));
  proc.stderr.on('data', d => process.stderr.write('[uvicorn] ' + d));

  // Store PID so global teardown can kill it
  process.env._UVICORN_PID = String(proc.pid);

  const up = await waitForServer(MAX_WAIT_MS);
  if (!up) {
    proc.kill();
    throw new Error(`[global-setup] Server did not start within ${MAX_WAIT_MS}ms`);
  }
  console.log('[global-setup] Server is up on port', PORT);
};
