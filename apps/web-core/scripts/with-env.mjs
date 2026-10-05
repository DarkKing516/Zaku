#!/usr/bin/env node
// Runs a Next.js command after loading `.env.<environment>`. Usage: node scripts/with-env.mjs <dev|qa|cer|production> <build|start> [args]
// Variables already present (secrets injected by the pipeline) are never overwritten, so the templates carry no secrets.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const FILES = {
  dev: '.env.dev',
  qa: '.env.qa',
  cer: '.env.certification',
  production: '.env.production',
};

const [environment, command, ...nextArgs] = process.argv.slice(2);
const file = FILES[environment];

if (!file || !command) {
  console.error(`Usage: node scripts/with-env.mjs <${Object.keys(FILES).join('|')}> <build|start|…> [next arguments]`);
  process.exit(1);
}

const envPath = resolve(process.cwd(), file);
if (!existsSync(envPath)) {
  console.error(`${file} does not exist (expected at ${envPath}).`);
  process.exit(1);
}

const alreadyDefined = new Set(Object.keys(process.env));
process.loadEnvFile(envPath);
// An empty template value must not hide the one Next.js loads from .env.local.
for (const [key, value] of Object.entries(process.env)) {
  if (value === '' && !alreadyDefined.has(key)) {
    delete process.env[key];
  }
}
console.log(`[with-env] ${file} loaded -> APP_ENV=${process.env.APP_ENV ?? '(unset)'}`);

const nextBin = resolve(process.cwd(), 'node_modules/next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, command, ...nextArgs], { stdio: 'inherit', env: process.env });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
