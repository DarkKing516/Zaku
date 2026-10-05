import { join, relative, sep } from 'node:path';
import { APP_ROOT, readProjectFiles, resolveSourceSpecifier, SOURCE_ROOT, TEST_ROOT, toPosix } from '@test/support/project-files';

const TEST_FILE_PATTERN = /\.(spec|e2e-spec|int-spec|test)\.(ts|tsx)$/;
const HELPER_FOLDERS = ['support', 'setup'];
const EXPECTED_FOLDERS: ReadonlyArray<{ pattern: RegExp; folders: readonly string[]; expectation: string }> = [
  { pattern: /\.e2e-spec\.tsx?$/, folders: ['e2e'], expectation: 'e2e specs only run from test/e2e/' },
  { pattern: /\.spec\.tsx?$/, folders: ['unit', 'architecture'], expectation: 'unit specs only run from test/unit/ or test/architecture/' },
  { pattern: /\.test\.tsx?$/, folders: [], expectation: 'no Jest project runs *.test.ts; use *.spec.ts' },
];

const sourcePaths = new Set(readProjectFiles(SOURCE_ROOT).map((file) => file.relativePath));
const testFiles = readProjectFiles(TEST_ROOT).map((file) => ({ ...file, folder: file.relativePath.includes('/') ? file.relativePath.split('/')[0] : '' }));
const unitSpecs = testFiles.filter((file) => file.folder === 'unit' && /\.spec\.tsx?$/.test(file.relativePath));

const mirroredSourceStem = (relativePath: string) => relativePath.slice('unit/'.length).replace(/\.spec\.tsx?$/, '');
const mirroredSourcePath = (relativePath: string) => {
  const stem = mirroredSourceStem(relativePath);
  return [`${stem}.ts`, `${stem}.tsx`].find((candidate) => sourcePaths.has(candidate));
};

describe('Architecture: test layout', () => {
  it('scans the source and test trees', () => {
    expect(sourcePaths.size).toBeGreaterThan(40);
    expect(unitSpecs.length).toBeGreaterThan(20);
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
    expect(unitSpecs.filter((spec) => !mirroredSourcePath(spec.relativePath)).map((spec) => spec.relativePath)).toEqual([]);
  });

  it('makes each unit spec import the file it mirrors', () => {
    const notImportingSubject = unitSpecs
      .filter((spec) => {
        const subject = join(SOURCE_ROOT, mirroredSourceStem(spec.relativePath));
        return !spec.imports.some((specifier) => resolveSourceSpecifier(spec.path, specifier) === subject);
      })
      .map((spec) => spec.relativePath);

    expect(notImportingSubject).toEqual([]);
  });

  it('imports production code only through the @/ alias', () => {
    const relativeSourceImports = testFiles.flatMap((file) =>
      file.imports
        .filter((specifier) => specifier.startsWith('.'))
        .map((specifier) => resolveSourceSpecifier(file.path, specifier) ?? '')
        .filter((target) => target.startsWith(`${SOURCE_ROOT}${sep}`))
        .map((target) => `${file.relativePath} -> ${toPosix(relative(APP_ROOT, target))}`),
    );

    expect(relativeSourceImports).toEqual([]);
  });
});
