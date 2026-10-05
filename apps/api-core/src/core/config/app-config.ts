import { EnvironmentVariables, RuntimeEnvironment } from './environment-variables';

export interface AccessTokenConfig {
  readonly secret: string;
  readonly expiresInSeconds: number;
}

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly ssl: boolean;
  readonly controlDatabaseName: string;
  readonly tenantPoolMax: number;
  readonly poolIdleTimeoutMs: number;
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
}

export interface RateLimitConfig {
  readonly windowMs: number;
  readonly maxRequests: number;
  readonly credentialsMaxRequests: number;
  readonly credentialsPerIpMaxRequests: number;
}

export type TrustProxySetting = boolean | number | string;

export function parseTrustProxy(rawValue: string): TrustProxySetting {
  const value = rawValue.trim();
  if (value === '' || value === 'false') {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  return /^\d+$/.test(value) ? Number(value) : value;
}

export interface MocksConfig {
  readonly adapters: string;
  readonly seedData: boolean;
}

export interface AppConfigValues {
  readonly runtimeEnvironment: RuntimeEnvironment;
  readonly httpPort: number;
  readonly trustProxy: TrustProxySetting;
  readonly swaggerEnabled: boolean;
  readonly scalarEnabled: boolean;
  readonly accessToken: AccessTokenConfig;
  readonly database: DatabaseConfig;
  readonly tenantStatusCacheTtlMs: number;
  readonly redisUrl: string;
  readonly rateLimit: RateLimitConfig;
  readonly mocks: MocksConfig;
}

export class AppConfig implements AppConfigValues {
  readonly runtimeEnvironment: RuntimeEnvironment;
  readonly httpPort: number;
  readonly trustProxy: TrustProxySetting;
  readonly swaggerEnabled: boolean;
  readonly scalarEnabled: boolean;
  readonly accessToken: AccessTokenConfig;
  readonly database: DatabaseConfig;
  readonly tenantStatusCacheTtlMs: number;
  readonly redisUrl: string;
  readonly rateLimit: RateLimitConfig;
  readonly mocks: MocksConfig;

  constructor(values: AppConfigValues) {
    this.runtimeEnvironment = values.runtimeEnvironment;
    this.httpPort = values.httpPort;
    this.trustProxy = values.trustProxy;
    this.swaggerEnabled = values.swaggerEnabled;
    this.scalarEnabled = values.scalarEnabled;
    this.accessToken = values.accessToken;
    this.database = values.database;
    this.tenantStatusCacheTtlMs = values.tenantStatusCacheTtlMs;
    this.redisUrl = values.redisUrl;
    this.rateLimit = values.rateLimit;
    this.mocks = values.mocks;
  }

  static fromEnvironment(environment: EnvironmentVariables): AppConfig {
    return new AppConfig({
      runtimeEnvironment: environment.NODE_ENV,
      httpPort: environment.PORT,
      trustProxy: parseTrustProxy(environment.TRUST_PROXY),
      swaggerEnabled: environment.SWAGGER_ENABLED ?? environment.NODE_ENV !== RuntimeEnvironment.Production,
      scalarEnabled: environment.SCALAR_ENABLED ?? environment.NODE_ENV !== RuntimeEnvironment.Production,
      accessToken: {
        secret: environment.JWT_SECRET,
        expiresInSeconds: environment.JWT_EXPIRES_IN_SECONDS,
      },
      database: {
        host: environment.DATABASE_HOST,
        port: environment.DATABASE_PORT,
        user: environment.DATABASE_USER,
        password: environment.DATABASE_PASSWORD,
        ssl: environment.DATABASE_SSL,
        controlDatabaseName: environment.CONTROL_DATABASE_NAME,
        tenantPoolMax: environment.TENANT_DATABASE_POOL_MAX,
        poolIdleTimeoutMs: environment.DATABASE_POOL_IDLE_TIMEOUT_MS,
        connectionTimeoutMs: environment.DATABASE_CONNECTION_TIMEOUT_MS,
        statementTimeoutMs: environment.DATABASE_STATEMENT_TIMEOUT_MS,
      },
      tenantStatusCacheTtlMs: environment.TENANT_STATUS_CACHE_TTL_MS,
      redisUrl: environment.REDIS_URL,
      rateLimit: {
        windowMs: environment.RATE_LIMIT_WINDOW_MS,
        maxRequests: environment.RATE_LIMIT_MAX_REQUESTS,
        credentialsMaxRequests: environment.RATE_LIMIT_CREDENTIALS_MAX_REQUESTS,
        credentialsPerIpMaxRequests: environment.RATE_LIMIT_CREDENTIALS_PER_IP_MAX_REQUESTS,
      },
      mocks: {
        adapters: environment.MOCK_ADAPTERS,
        seedData: environment.MOCK_SEED_DATA,
      },
    });
  }
}
