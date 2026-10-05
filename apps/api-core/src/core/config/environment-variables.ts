import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export enum RuntimeEnvironment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export class EnvironmentVariables {
  @IsEnum(RuntimeEnvironment)
  NODE_ENV!: RuntimeEnvironment;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @MinLength(16)
  JWT_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(86_400)
  JWT_EXPIRES_IN_SECONDS = 3600;

  @IsString()
  DATABASE_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT = 5432;

  @IsString()
  DATABASE_USER = 'postgres';

  @IsString()
  DATABASE_PASSWORD = 'postgres';

  @Transform(toBoolean)
  @IsBoolean()
  DATABASE_SSL = false;

  @IsString()
  CONTROL_DATABASE_NAME = 'zaku_control';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  TENANT_DATABASE_POOL_MAX = 5;

  @Type(() => Number)
  @IsInt()
  @Min(1000)
  DATABASE_POOL_IDLE_TIMEOUT_MS = 30_000;

  @Type(() => Number)
  @IsInt()
  @Min(500)
  DATABASE_CONNECTION_TIMEOUT_MS = 5000;

  @Type(() => Number)
  @IsInt()
  @Min(1000)
  DATABASE_STATEMENT_TIMEOUT_MS = 30_000;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(300_000)
  TENANT_STATUS_CACHE_TTL_MS = 30_000;

  @IsString()
  REDIS_URL = 'redis://localhost:6379';

  @IsString()
  TRUST_PROXY = 'false';

  @Type(() => Number)
  @IsInt()
  @Min(1000)
  RATE_LIMIT_WINDOW_MS = 60_000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX_REQUESTS = 300;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_CREDENTIALS_MAX_REQUESTS = 10;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_CREDENTIALS_PER_IP_MAX_REQUESTS = 60;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  SWAGGER_ENABLED?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  SCALAR_ENABLED?: boolean;

  @IsString()
  MOCK_ADAPTERS = '';

  @Transform(toBoolean)
  @IsBoolean()
  MOCK_SEED_DATA = false;
}
