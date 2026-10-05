import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { listFiles, readProjectFiles, resolveSourceSpecifier, SOURCE_ROOT, toPosix, type ProjectFile } from '@test/support/project-files';

const sourceFiles = readProjectFiles(SOURCE_ROOT);

const LAYER_ORDER = ['shared', 'modules', 'layout', 'app'] as const;
type Layer = (typeof LAYER_ORDER)[number] | 'root';

const layerOf = (relativePath: string): Layer => {
  const top = relativePath.split('/')[0];
  return (LAYER_ORDER as readonly string[]).includes(top) ? (top as Layer) : 'root';
};

const moduleOf = (relativePath: string) => (relativePath.startsWith('modules/') ? relativePath.split('/')[1] : undefined);

function internalTargets(file: ProjectFile): { specifier: string; target: string }[] {
  return file.imports.flatMap((specifier) => {
    const resolved = resolveSourceSpecifier(file.path, specifier);
    if (!resolved) {
      return [];
    }
    const target = toPosix(relative(SOURCE_ROOT, resolved));
    return target.startsWith('..') ? [] : [{ specifier, target }];
  });
}

const NEXT_ROUTING_FILES = new Set(['page.tsx', 'layout.tsx', 'error.tsx', 'not-found.tsx', 'loading.tsx', 'route.ts', 'globals.css', 'icon.svg', 'favicon.ico']);

describe('Architecture: dependency rules', () => {
  it('scans the source tree', () => {
    expect(sourceFiles.length).toBeGreaterThan(40);
  });

  it('only depends downwards: app -> layout -> modules -> shared', () => {
    const upwardImports = sourceFiles.flatMap((file) => {
      const fromLayer = layerOf(file.relativePath);
      if (fromLayer === 'root') {
        return [];
      }
      return internalTargets(file)
        .filter(({ target }) => {
          const toLayer = layerOf(target);
          return toLayer !== 'root' && LAYER_ORDER.indexOf(toLayer) > LAYER_ORDER.indexOf(fromLayer);
        })
        .map(({ specifier }) => `${file.relativePath} -> ${specifier}`);
    });

    expect(upwardImports).toEqual([]);
  });

  it('keeps the server folder of a module private to that module and to the composition layers', () => {
    const leaks = sourceFiles.flatMap((file) => {
      const ownModule = moduleOf(file.relativePath);
      if (ownModule === undefined) {
        return [];
      }
      return internalTargets(file)
        .filter(({ target }) => moduleOf(target) !== undefined && moduleOf(target) !== ownModule && target.split('/')[2] === 'server')
        .map(({ specifier }) => `${file.relativePath} -> ${specifier}`);
    });

    expect(leaks).toEqual([]);
  });

  it('marks every runtime file inside a server/ folder with import "server-only"', () => {
    const unmarked = sourceFiles
      .filter((file) => file.relativePath.split('/').includes('server'))
      .filter((file) => !/^export type \{[^}]+\} from '[^']+';\s*$/.test(file.content))
      .filter((file) => !file.content.startsWith("import 'server-only';"))
      .map((file) => file.relativePath);

    expect(unmarked).toEqual([]);
  });

  it('reads process.env only in shared/server/env.ts', () => {
    const readers = sourceFiles
      .filter((file) => /process\.env/.test(file.content) && file.relativePath !== 'shared/server/env.ts')
      .map((file) => file.relativePath);

    expect(readers).toEqual([]);
  });

  it('keeps both branches of the mock <-> real switch in every service method', () => {
    const services = sourceFiles.filter((file) => file.relativePath.endsWith('.service.ts'));
    const incomplete = services.flatMap((file) => {
      const methods = [...file.content.matchAll(/static async (\w+)\(/g)];
      return methods
        .filter((match, index) => {
          const body = file.content.slice(match.index, methods[index + 1]?.index ?? file.content.length);
          return !/return mock\(/.test(body) || !/return http\./.test(body);
        })
        .map((match) => `${file.relativePath}#${match[1]}`);
    });

    expect(services.length).toBeGreaterThan(0);
    expect(incomplete).toEqual([]);
  });

  it('turns every BFF route file into a one-line re-export of a module handler', () => {
    const routes = sourceFiles.filter((file) => file.relativePath.startsWith('app/api/') && file.relativePath.endsWith('/route.ts'));
    const handWritten = routes
      .filter((file) => !/^(export \{ \w+ as (GET|POST|PUT|PATCH|DELETE) \} from '@\/modules\/[^']+\/server\/[^']+\.bff';\n)+$/.test(file.content))
      .map((file) => file.relativePath);

    expect(routes.length).toBeGreaterThan(0);
    expect(handWritten).toEqual([]);
  });

  it('keeps app/ for routing files only: components, hooks and providers live in modules/', () => {
    const appRoot = join(SOURCE_ROOT, 'app');
    const strayFiles = listFiles(appRoot)
      .map((path) => toPosix(relative(appRoot, path)))
      .filter((path) => !NEXT_ROUTING_FILES.has(path.split('/').at(-1) ?? ''));

    expect(readdirSync(appRoot).length).toBeGreaterThan(0);
    expect(strayFiles).toEqual([]);
  });
});
