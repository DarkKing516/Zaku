import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const DATABASE_IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]{0,62}$/;

export function controlDatabaseName(): string {
  const databaseName = process.env.CONTROL_DATABASE_NAME ?? 'zaku_control';
  if (!DATABASE_IDENTIFIER_PATTERN.test(databaseName)) {
    throw new Error(`CONTROL_DATABASE_NAME "${databaseName}" is not a valid database identifier`);
  }
  return databaseName;
}

export function connectionOptionsFor(databaseName: string): PostgresConnectionOptions {
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: databaseName,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
    synchronize: false,
    logging: false,
  };
}
