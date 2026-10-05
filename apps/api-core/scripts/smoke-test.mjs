import { spawn } from 'node:child_process';

const port = process.env.SMOKE_TEST_PORT ?? '3999';
const baseUrl = `http://127.0.0.1:${port}`;
const bootTimeoutMs = 30_000;
const checkedPaths = ['/health', '/api/documentation/swagger-json', '/api/documentation/scalar'];

const api = spawn(process.execPath, ['dist/main.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: port,
    JWT_SECRET: 'smoke-test-secret-with-enough-length',
    MOCK_ADAPTERS: '*',
    MOCK_SEED_DATA: 'false',
    SWAGGER_ENABLED: 'true',
    SCALAR_ENABLED: 'true',
  },
  stdio: ['ignore', 'ignore', 'inherit'],
});

const apiExited = new Promise((_resolve, reject) => {
  api.once('exit', (code) => reject(new Error(`API exited during the smoke test with code ${code}`)));
});

async function isHealthy() {
  try {
    return (await fetch(`${baseUrl}/health`)).ok;
  } catch {
    return false;
  }
}

async function waitUntilHealthy() {
  const deadline = Date.now() + bootTimeoutMs;
  while (Date.now() < deadline) {
    if (await isHealthy()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`API did not become healthy within ${bootTimeoutMs} ms`);
}

async function checkPaths() {
  for (const path of checkedPaths) {
    const response = await fetch(`${baseUrl}${path}`);
    if (response.status !== 200) {
      throw new Error(`GET ${path} answered ${response.status}`);
    }
  }
}

try {
  await Promise.race([waitUntilHealthy().then(checkPaths), apiExited]);
  console.log(`Smoke test passed: ${checkedPaths.join(', ')}`);
} catch (error) {
  console.error(`Smoke test failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  api.removeAllListeners('exit');
  api.kill();
}
