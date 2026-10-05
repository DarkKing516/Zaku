import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { importSpecifiersOf, listTypeScriptFiles, SOURCE_ROOT, toPosix } from '@test/support/project-files';

const FRAMEWORK_PACKAGES = /^(@nestjs\/|typeorm|express|ioredis|bcrypt|@zaku\/database-lib)/;

interface SourceFile {
  readonly path: string;
  readonly relativePath: string;
  readonly area: string;
  readonly content: string;
  readonly imports: readonly string[];
}

function areaOf(absolutePath: string): string {
  const segments = relative(SOURCE_ROOT, absolutePath).split(sep);
  if (segments[0] === 'modules') {
    const layer = ['domain', 'application', 'infrastructure'].includes(segments[2]) ? segments[2] : 'root';
    return `modules/${segments[1]}/${layer}`;
  }
  return segments.length === 1 ? 'composition-root' : segments[0];
}

function moduleNameOf(area: string): string | undefined {
  return area.startsWith('modules/') ? area.split('/')[1] : undefined;
}

function resolveRelativeImport(fromFile: string, specifier: string): string {
  return resolve(dirname(fromFile), specifier);
}

const sourceFiles: SourceFile[] = listTypeScriptFiles(SOURCE_ROOT).map((path) => {
  const content = readFileSync(path, 'utf8');
  return { path, relativePath: toPosix(relative(SOURCE_ROOT, path)), area: areaOf(path), content, imports: importSpecifiersOf(content) };
});

function violations(predicate: (file: SourceFile, specifier: string) => string | null): string[] {
  return sourceFiles.flatMap((file) =>
    file.imports.flatMap((specifier) => {
      const problem = predicate(file, specifier);
      return problem ? [`${file.relativePath} -> ${specifier}: ${problem}`] : [];
    }),
  );
}

function targetAreaOf(file: SourceFile, specifier: string): string | undefined {
  if (specifier.startsWith('.')) {
    return areaOf(resolveRelativeImport(file.path, specifier));
  }
  const aliasMatch = /^@(common|core|modules)\/(.+)$/.exec(specifier);
  if (!aliasMatch) {
    return undefined;
  }
  return aliasMatch[1] === 'modules' ? areaOf(join(SOURCE_ROOT, 'modules', aliasMatch[2], 'x.ts')) : aliasMatch[1];
}

describe('Architecture: dependency rules', () => {
  it('scans the source tree', () => {
    expect(sourceFiles.length).toBeGreaterThan(50);
  });

  it('common/ is framework free and depends on nothing internal', () => {
    expect(
      violations((file, specifier) => {
        if (file.area !== 'common') {
          return null;
        }
        if (FRAMEWORK_PACKAGES.test(specifier)) {
          return 'common must not depend on frameworks or I/O libraries';
        }
        const target = targetAreaOf(file, specifier);
        return target && target !== 'common' ? `common must not import ${target}` : null;
      }),
    ).toEqual([]);
  });

  it('core/ never depends on business modules', () => {
    expect(
      violations((file, specifier) => {
        const target = targetAreaOf(file, specifier);
        return file.area === 'core' && target?.startsWith('modules/') ? 'core must not import modules' : null;
      }),
    ).toEqual([]);
  });

  it('domain/ only imports its own domain, common and node built-ins', () => {
    expect(
      violations((file, specifier) => {
        if (!file.area.endsWith('/domain')) {
          return null;
        }
        if (specifier.startsWith('node:') || specifier.startsWith('@common/')) {
          return null;
        }
        const target = targetAreaOf(file, specifier);
        return target === file.area ? null : 'domain may only import its own domain, @common/* and node:*';
      }),
    ).toEqual([]);
  });

  it('application/ only imports domain, common, other module contracts and the CQRS/DI primitives', () => {
    const allowedPackages = ['@nestjs/common', '@nestjs/cqrs'];
    expect(
      violations((file, specifier) => {
        if (!file.area.endsWith('/application')) {
          return null;
        }
        if (specifier.startsWith('node:') || specifier.startsWith('@common/') || allowedPackages.includes(specifier)) {
          return null;
        }
        if (/^@modules\/[^/]+$/.test(specifier)) {
          return null;
        }
        const target = targetAreaOf(file, specifier);
        const ownModule = moduleNameOf(file.area);
        if (target === `modules/${ownModule}/domain` || target === file.area) {
          return null;
        }
        return 'application may only import domain, @common/*, @nestjs/common, @nestjs/cqrs and the public index of other modules';
      }),
    ).toEqual([]);
  });

  it('commands and queries declare their result type', () => {
    const untyped = sourceFiles
      .filter((file) => /\.(command|query)\.ts$/.test(file.path))
      .filter((file) => !/extends (Command|Query)</.test(file.content))
      .map((file) => file.relativePath);

    expect(untyped).toEqual([]);
  });

  it('module files wire concrete I/O adapters only through provideSwitchableAdapter', () => {
    const moduleFiles = sourceFiles.filter((file) => /modules[\\/][^\\/]+[\\/][^\\/]+\.module\.ts$/.test(file.path));
    const problems = moduleFiles
      .flatMap((file) =>
        file.content
          .split('\n')
          .filter((line) => !line.startsWith('import '))
          .filter((line) => /\b(TypeOrm|Postgres|Redis)[A-Z]\w*/.test(line))
          .filter((line) => !/^\s*real: \w+,\s*$/.test(line))
          .map((line) => `${file.relativePath}: "${line.trim()}"`),
      );

    expect(moduleFiles.length).toBeGreaterThanOrEqual(3);
    expect(problems).toEqual([]);
  });

  it('modules talk to each other only through their public index', () => {
    expect(
      violations((file, specifier) => {
        const ownModule = moduleNameOf(file.area);
        if (!ownModule) {
          return null;
        }
        if (specifier.startsWith('.')) {
          const targetModule = moduleNameOf(areaOf(resolveRelativeImport(file.path, specifier)));
          return targetModule !== ownModule ? 'relative imports must not leave the module' : null;
        }
        const aliasMatch = /^@modules\/([^/]+)(\/.*)?$/.exec(specifier);
        if (!aliasMatch) {
          return null;
        }
        if (aliasMatch[1] === ownModule) {
          return 'use relative imports inside the same module';
        }
        return aliasMatch[2] ? `import from "@modules/${aliasMatch[1]}" (its index.ts) instead of a deep path` : null;
      }),
    ).toEqual([]);
  });

  it('public module APIs expose only contracts: commands, queries, views, HTTP DTOs and domain types, never aggregates', () => {
    const contractPath =
      /^\.\/(application\/(commands|queries)\/[^/]+\/[^/]+\.(command|query)|application\/views\/[^/]+\.view|infrastructure\/http\/dtos\/[^/]+\.dto|domain\/(errors|value-objects)\/[^/]+|domain\/[^/]+-status)$/;
    const leaks = sourceFiles
      .filter((file) => /modules[\\/][^\\/]+[\\/]index\.ts$/.test(file.path))
      .flatMap((file) =>
        file.imports
          .filter((specifier) => !contractPath.test(specifier))
          .map((specifier) => `${file.relativePath} -> ${specifier}`),
      );

    expect(leaks).toEqual([]);
  });

  it('only core/config reads process.env', () => {
    const readers = sourceFiles
      .filter((file) => file.content.includes('process.env') && !file.path.includes(join('core', 'config')))
      .map((file) => file.relativePath);

    expect(readers).toEqual([]);
  });

  it('every command and query has a handler registered in its module', () => {
    const problems = sourceFiles
      .filter((file) => /[\\/]application[\\/](commands|queries)[\\/]/.test(file.path))
      .filter((file) => /\.(command|query)\.ts$/.test(file.path))
      .flatMap((file) => {
        const handlerPath = file.path.replace(/\.(command|query)\.ts$/, '.handler.ts');
        if (!existsSync(handlerPath)) {
          return [`${file.relativePath} has no sibling handler`];
        }
        const handlerClass = /export class (\w+Handler)/.exec(readFileSync(handlerPath, 'utf8'))?.[1];
        const moduleName = moduleNameOf(file.area) ?? '';
        const moduleFile = join(SOURCE_ROOT, 'modules', moduleName, `${moduleName}.module.ts`);
        const providers = /providers:\s*\[([\s\S]*?)\](?=,?\s*\n( {2}\w+:|\}\)))/.exec(readFileSync(moduleFile, 'utf8'))?.[1] ?? '';
        const registered = handlerClass !== undefined && new RegExp(`\\b${handlerClass}\\b`).test(providers);
        return registered ? [] : [`${handlerClass ?? handlerPath} is not registered in ${moduleName}.module.ts`];
      });

    expect(problems).toEqual([]);
  });
});
