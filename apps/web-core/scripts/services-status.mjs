#!/usr/bin/env node
// Lists every service method in MOCK or REAL mode. `--require-real` exits with 1 while any method is still mocked.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const MODULES = join(ROOT, 'src', 'modules');
const requireReal = process.argv.includes('--require-real');

const walk = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const rows = walk(MODULES)
  .filter((path) => path.endsWith('.service.ts'))
  .flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    const className = source.match(/export class (\w+)/)?.[1] ?? relative(ROOT, file);
    const methods = [...source.matchAll(/static async (\w+)\(/g)];
    return methods.map((match, index) => {
      const body = source.slice(match.index, methods[index + 1]?.index ?? source.length);
      const isMock = /^[ \t]*return mock\(/m.test(body);
      const isReal = /^[ \t]*return http\./m.test(body);
      return { method: `${className}.${match[1]}`, mode: isMock ? 'MOCK' : isReal ? 'REAL' : '?' };
    });
  });

const width = Math.max(...rows.map((row) => row.method.length), 14);
console.log(`\n  ${'Service.method'.padEnd(width)}  Mode`);
console.log(`  ${'─'.repeat(width)}  ─────`);
rows.forEach((row) => console.log(`  ${row.method.padEnd(width)}  ${row.mode}`));

const mocked = rows.filter((row) => row.mode !== 'REAL').length;
console.log(`\n  ${rows.length - mocked} REAL · ${mocked} MOCK\n`);

if (requireReal && mocked > 0) {
  console.error('✖ --require-real: some methods are still mocked. Comment out their `return mock(...)` line.');
  process.exit(1);
}
