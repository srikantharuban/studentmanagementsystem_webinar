// @ts-check
'use strict';

const base   = require('@playwright/test');
const { spawn } = require('child_process');
const http   = require('http');

const PYTHON  = 'd:\\webinar\\Webinar\\StudentManagementSystem_demo\\venv\\Scripts\\python.exe';
const CWD     = 'd:\\webinar\\Webinar\\StudentManagementSystem_demo';
const PORT    = 8000;

function isServerUp() {
  return new Promise((resolve) => {
    http.get(`http://localhost:${PORT}/`, (res) => {
      res.resume();
      resolve(true);
    }).on('error', () => resolve(false));
  });
}

async function ensureServer() {
  if (await isServerUp()) return;

  const proc = spawn(PYTHON, ['-m', 'uvicorn', 'app.main:app', '--port', String(PORT)], {
    cwd: CWD,
    detached: false,
    stdio: 'pipe',
  });
  proc.stderr.on('data', d => process.stderr.write('[uvicorn] ' + d));

  // Wait up to 20 s for the server to come up
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 500));
    if (await isServerUp()) return;
  }
  throw new Error('FastAPI server did not start within 20 s');
}

exports.test = base.test.extend({
  freshPage: async ({ page }, use) => {
    await ensureServer();
    await page.goto('http://localhost:8000/ui/login.html');
    await page.evaluate(() => sessionStorage.clear());
    await use(page);
  },
});

exports.expect = base.expect;
