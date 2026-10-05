import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

export const APP_ROOT = resolve(__dirname, '../..');
export const SOURCE_ROOT = join(APP_ROOT, 'src');
export const TEST_ROOT = join(APP_ROOT, 'test');

const STATIC_IMPORT_PATTERN = /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const CALL_IMPORT_PATTERN = /\b(?:import|require|jest\.mock)\(\s*['"]([^'"]+)['"]/g;

export interface ProjectFile {
  readonly path: string;
  readonly relativePath: string;
  readonly content: string;
  readonly imports: readonly string[];
}

export function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    return statSync(fullPath).isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

export const toPosix = (path: string) => path.split(sep).join('/');

export function readProjectFiles(root: string, extensions = /\.(ts|tsx)$/): ProjectFile[] {
  return listFiles(root)
    .filter((path) => extensions.test(path))
    .map((path) => {
      const content = readFileSync(path, 'utf8');
      return { path, relativePath: toPosix(relative(root, path)), content, imports: importSpecifiersOf(content) };
    });
}

export function importSpecifiersOf(content: string): string[] {
  return [...content.matchAll(STATIC_IMPORT_PATTERN), ...content.matchAll(CALL_IMPORT_PATTERN)].map((match) => match[1]);
}

export function resolveSourceSpecifier(fromFile: string, specifier: string): string | undefined {
  if (specifier.startsWith('@/')) {
    return join(SOURCE_ROOT, specifier.slice(2));
  }
  return specifier.startsWith('.') ? resolve(dirname(fromFile), specifier) : undefined;
}
