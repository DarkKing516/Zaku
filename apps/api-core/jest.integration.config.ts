import type { Config } from 'jest';
import { sharedProjectConfig } from './jest.config';

const config: Config = {
  ...sharedProjectConfig,
  displayName: 'integration',
  testMatch: ['<rootDir>/test/integration/**/*.int-spec.ts'],
  setupFiles: ['reflect-metadata', '<rootDir>/test/setup/integration-environment.setup.ts'],
  globalSetup: '<rootDir>/test/setup/integration-global-setup.ts',
  globalTeardown: '<rootDir>/test/setup/integration-global-teardown.ts',
  testTimeout: 60_000,
};

export default config;
