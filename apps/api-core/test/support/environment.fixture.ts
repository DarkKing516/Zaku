export const DEVELOPMENT_ENVIRONMENT = { NODE_ENV: 'development', JWT_SECRET: 'a-sufficiently-long-secret' };

export const PRODUCTION_ENVIRONMENT = {
  NODE_ENV: 'production',
  JWT_SECRET: 'a-production-secret-that-is-long-enough!!',
  DATABASE_PASSWORD: 'strong-database-password',
};
