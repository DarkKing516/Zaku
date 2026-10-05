import { readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

export const APP_ROOT = resolve(__dirname, '../..');
export const SOURCE_ROOT = join(APP_ROOT, 'src');
export const TEST_ROOT = join(APP_ROOT, 'test');

const STATIC_IMPORT_PATTERN = /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const CALL_IMPORT_PATTERN = /\b(?:import|require|jest\.mock)\(\s*['"]([^'"]+)['"]/g;
const SOURCE_ALIAS_PATTERN = /^@(common|core|modules)\/(.+)$/;

export function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      return listTypeScriptFiles(fullPath);
    }
    return entry.endsWith('.ts') ? [fullPath] : [];
  });
}

export function importSpecifiersOf(content: string): string[] {
  return [...content.matchAll(STATIC_IMPORT_PATTERN), ...content.matchAll(CALL_IMPORT_PATTERN)].map((match) => match[1]);
}

export function resolveSourceSpecifier(fromFile: string, specifier: string): string | undefined {
  if (specifier.startsWith('.')) {
    return resolve(dirname(fromFile), specifier);
  }
  const aliasMatch = SOURCE_ALIAS_PATTERN.exec(specifier);
  return aliasMatch ? join(SOURCE_ROOT, aliasMatch[1], aliasMatch[2]) : undefined;
}

export function toPosix(path: string): string {
  return path.split(sep).join('/');
}
