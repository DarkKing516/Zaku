import type { Config } from 'jest';

export const sharedProjectConfig = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': 'ts-jest' },
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    // @scalar/nestjs-api-reference depends on ESM-only packages that the CommonJS Jest runtime cannot load.
    '^@scalar/nestjs-api-reference$': '<rootDir>/test/support/scalar-api-reference.stub.ts',
    '^@zaku/database-lib$': '<rootDir>/../../packages/database-lib/src',
    '^@zaku/shared-types$': '<rootDir>/../../packages/shared-types/src',
  },
} satisfies Config;

const config: Config = {
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/index.ts', '!src/**/*.module.ts'],
  coverageThreshold: {
    global: { lines: 65, branches: 70 },
    './src/modules/**/{domain,application}/**/*.ts': { lines: 90, branches: 80, functions: 85 },
  },
  projects: [
    {
      ...sharedProjectConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts', '<rootDir>/test/architecture/**/*.spec.ts'],
      setupFiles: ['reflect-metadata', '<rootDir>/test/setup/unit.setup.ts'],
    },
    {
      ...sharedProjectConfig,
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
      setupFiles: ['reflect-metadata', '<rootDir>/test/setup/mock-environment.setup.ts'],
    },
  ],
};

export default config;
