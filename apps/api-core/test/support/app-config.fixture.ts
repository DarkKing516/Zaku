import { AppConfig, AppConfigValues } from '@core/config/app-config';
import { RuntimeEnvironment } from '@core/config/environment-variables';

export function buildAppConfig(overrides: Partial<AppConfigValues> = {}): AppConfig {
  return new AppConfig({
    runtimeEnvironment: RuntimeEnvironment.Test,
    httpPort: 0,
    trustProxy: false,
    swaggerEnabled: true,
    scalarEnabled: true,
    accessToken: { secret: 'unit-test-secret-with-enough-length', expiresInSeconds: 3600 },
    database: {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      ssl: false,
      controlDatabaseName: 'zaku_control_test',
      tenantPoolMax: 2,
      poolIdleTimeoutMs: 1000,
      connectionTimeoutMs: 1000,
      statementTimeoutMs: 5000,
    },
    tenantStatusCacheTtlMs: 0,
    redisUrl: 'redis://localhost:6379',
    rateLimit: { windowMs: 60_000, maxRequests: 10_000, credentialsMaxRequests: 10_000, credentialsPerIpMaxRequests: 10_000 },
    mocks: { adapters: '*', seedData: false },
    ...overrides,
  });
}
