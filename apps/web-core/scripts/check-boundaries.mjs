#!/usr/bin/env node
// Fails when browser-safe code (src/modules and src/shared outside any server/ folder) imports server code,
// server-only packages, calls an absolute URL or reads environment variables. Usage: pnpm check:boundaries
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SOURCE = join(ROOT, 'src');
const BROWSER_SAFE_ROOTS = [join(SOURCE, 'modules'), join(SOURCE, 'shared')];
const CODE_FILE = /\.(ts|tsx|js|jsx|mjs)$/;
const SERVER_ONLY_PACKAGES = [/^iron-session$/, /^server-only$/, /^next\/headers$/, /^next\/server$/, /^node:/];
const IMPORT_PATTERNS = [/\bfrom\s+["']([^"']+)["']/g, /\bimport\s+["']([^"']+)["']/g, /\bimport\(\s*["']([^"']+)["']\s*\)/g, /\brequire\(\s*["']([^"']+)["']\s*\)/g];

const walk = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const isServerPath = (path) => path.split(sep).includes('server');

const importsOf = (source) => IMPORT_PATTERNS.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));

function resolveInternal(specifier, fromFile) {
  if (specifier.startsWith('@/')) {
    return join(SOURCE, specifier.slice(2));
  }
  return specifier.startsWith('.') ? join(fromFile, '..', specifier) : null;
}

const violations = [];

for (const root of BROWSER_SAFE_ROOTS) {
  for (const file of walk(root).filter((path) => CODE_FILE.test(path) && !isServerPath(relative(SOURCE, path)))) {
    const source = readFileSync(file, 'utf8');
    const displayPath = relative(ROOT, file);

    for (const specifier of importsOf(source)) {
      const internal = resolveInternal(specifier, file);
      if (internal && isServerPath(relative(SOURCE, internal))) {
        violations.push(`${displayPath}\n    imports server code -> "${specifier}"`);
      }
      if (SERVER_ONLY_PACKAGES.some((pattern) => pattern.test(specifier))) {
        violations.push(`${displayPath}\n    imports a server-only package -> "${specifier}"`);
      }
    }
    if (/\bfetch\(\s*[`"']https?:\/\//.test(source)) {
      violations.push(`${displayPath}\n    fetches an absolute URL: the browser may only call /api/* (BFF)`);
    }
    if (/process\.env\.(?!NODE_ENV\b)/.test(source)) {
      violations.push(`${displayPath}\n    reads environment variables in browser-safe code`);
    }
  }
}

if (violations.length > 0) {
  console.error(`\n✖ ${violations.length} client/server boundary violation(s):\n`);
  violations.forEach((violation) => console.error(`  • ${violation}\n`));
  process.exit(1);
}

console.log('✔ Client/server boundary OK: no browser code imports server code.');
