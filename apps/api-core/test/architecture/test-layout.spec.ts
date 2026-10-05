import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  APP_ROOT,
  importSpecifiersOf,
  listTypeScriptFiles,
  resolveSourceSpecifier,
  SOURCE_ROOT,
  TEST_ROOT,
  toPosix,
} from '@test/support/project-files';

const COMPOSITION_ROOT = join(SOURCE_ROOT, 'app.module');
const TEST_FILE_PATTERN = /\.(spec|e2e-spec|int-spec|test|contract)\.ts$/;
const HELPER_FOLDERS = ['support', 'setup'];
const EXPECTED_FOLDERS: ReadonlyArray<{ pattern: RegExp; folders: readonly string[]; expectation: string }> = [
  { pattern: /\.e2e-spec\.ts$/, folders: ['e2e'], expectation: 'e2e specs only run from test/e2e/' },
  { pattern: /\.int-spec\.ts$/, folders: ['integration'], expectation: 'integration specs only run from test/integration/' },
  { pattern: /\.spec\.ts$/, folders: ['unit', 'architecture'], expectation: 'unit specs only run from test/unit/ or test/architecture/' },
  { pattern: /\.contract\.ts$/, folders: ['contracts'], expectation: 'contract suites live in test/contracts/' },
  { pattern: /\.test\.ts$/, folders: [], expectation: 'no Jest project runs *.test.ts; use *.spec.ts' },
];

interface TestFile {
  readonly path: string;
  readonly relativePath: string;
  readonly folder: string;
  readonly imports: readonly string[];
}

const sourcePaths = new Set(listTypeScriptFiles(SOURCE_ROOT).map((path) => toPosix(relative(SOURCE_ROOT, path))));

const testFiles: TestFile[] = listTypeScriptFiles(TEST_ROOT).map((path) => {
  const relativePath = toPosix(relative(TEST_ROOT, path));
  const folder = relativePath.includes('/') ? relativePath.split('/')[0] : '';
  return { path, relativePath, folder, imports: importSpecifiersOf(readFileSync(path, 'utf8')) };
});

const unitSpecs = testFiles.filter((file) => file.folder === 'unit' && file.relativePath.endsWith('.spec.ts'));

function mirroredSourcePath(unitSpec: TestFile): string {
  return unitSpec.relativePath.slice('unit/'.length).replace(/\.spec\.ts$/, '.ts');
}

function importsSubject(unitSpec: TestFile): boolean {
  const subject = join(SOURCE_ROOT, mirroredSourcePath(unitSpec).replace(/\.ts$/, ''));
  return unitSpec.imports.some((specifier) => {
    const target = resolveSourceSpecifier(unitSpec.path, specifier);
    return target === subject || (target !== undefined && join(target, 'index') === subject);
  });
}

describe('Architecture: test layout', () => {
  it('scans the source and test trees', () => {
    expect(sourcePaths.size).toBeGreaterThan(50);
    expect(unitSpecs.length).toBeGreaterThan(40);
  });

  it('src/ holds runtime code only: every test lives under test/', () => {
    expect([...sourcePaths].filter((path) => TEST_FILE_PATTERN.test(path))).toEqual([]);
  });

  it('puts every test file in the folder whose Jest project runs it', () => {
    const misplaced = testFiles.flatMap((file) => {
      const expected = EXPECTED_FOLDERS.find(({ pattern }) => pattern.test(file.relativePath));
      if (!expected) {
        return HELPER_FOLDERS.includes(file.folder) ? [] : [`${file.relativePath}: helpers belong in test/support/ or test/setup/`];
      }
      return expected.folders.includes(file.folder) ? [] : [`${file.relativePath}: ${expected.expectation}`];
    });

    expect(misplaced).toEqual([]);
  });

  it('mirrors src/ in test/unit with exact, case-sensitive paths', () => {
    const orphans = unitSpecs.filter((spec) => !sourcePaths.has(mirroredSourcePath(spec))).map((spec) => spec.relativePath);

    expect(orphans).toEqual([]);
  });

  it('makes each unit spec import the file it mirrors', () => {
    const specsNotImportingTheirSubject = unitSpecs.filter((spec) => !importsSubject(spec)).map((spec) => spec.relativePath);

    expect(specsNotImportingTheirSubject).toEqual([]);
  });

  it('imports production code through aliases, except the composition root', () => {
    const relativeSourceImports = testFiles.flatMap((file) =>
      file.imports
        .filter((specifier) => specifier.startsWith('.'))
        .map((specifier) => resolveSourceSpecifier(file.path, specifier) ?? '')
        .filter((target) => target.startsWith(`${SOURCE_ROOT}${sep}`) && target !== COMPOSITION_ROOT)
        .map((target) => `${file.relativePath} -> ${toPosix(relative(APP_ROOT, target))}`),
    );

    expect(relativeSourceImports).toEqual([]);
  });

  it('lets a module unit spec reach other modules only through their public index', () => {
    const deepImports = unitSpecs
      .filter((spec) => spec.relativePath.startsWith('unit/modules/'))
      .flatMap((spec) => {
        const ownModule = spec.relativePath.split('/')[2];
        return spec.imports
          .filter((specifier) => {
            const targetModule = /^@modules\/([^/]+)\//.exec(specifier)?.[1];
            return targetModule !== undefined && targetModule !== ownModule;
          })
          .map((specifier) => `${spec.relativePath} -> ${specifier}`);
      });

    expect(deepImports).toEqual([]);
  });
});
