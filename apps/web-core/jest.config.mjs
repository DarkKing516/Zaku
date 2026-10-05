import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/unit/**/*.spec.{ts,tsx}', '<rootDir>/test/architecture/**/*.spec.ts'],
  setupFiles: ['<rootDir>/test/setup/environment.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/dom-matchers.setup.ts'],
  moduleNameMapper: {
    '^server-only$': '<rootDir>/test/support/empty-module.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageThreshold: {
    './src/shared/server/**/*.ts': { lines: 90, branches: 80 },
    // Services are excluded: their REAL branch stays unreachable while the mock line is active.
    './src/modules/*/server/!(*.service).ts': { lines: 90, branches: 80 },
  },
};

export default createJestConfig(config);
