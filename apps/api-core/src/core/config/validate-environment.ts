import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables, RuntimeEnvironment } from './environment-variables';

const MIN_PRODUCTION_SECRET_LENGTH = 32;
const DEVELOPMENT_DATABASE_PASSWORD = 'postgres';

export function validateEnvironment(rawEnvironment: Record<string, unknown>): EnvironmentVariables {
  const environment = plainToInstance(EnvironmentVariables, rawEnvironment);
  const problems = validateSync(environment, { whitelist: true }).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

  if (environment.NODE_ENV === RuntimeEnvironment.Production) {
    problems.push(...productionProblems(environment));
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${problems.join('\n- ')}`);
  }

  return environment;
}

function productionProblems(environment: EnvironmentVariables): string[] {
  const problems: string[] = [];
  if (environment.MOCK_ADAPTERS.trim() !== '') {
    problems.push('MOCK_ADAPTERS must be empty in production');
  }
  if (environment.MOCK_SEED_DATA) {
    problems.push('MOCK_SEED_DATA must be false in production');
  }
  if ((environment.JWT_SECRET ?? '').length < MIN_PRODUCTION_SECRET_LENGTH) {
    problems.push(`JWT_SECRET must have at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production`);
  }
  if (environment.DATABASE_PASSWORD === DEVELOPMENT_DATABASE_PASSWORD) {
    problems.push('DATABASE_PASSWORD must not use the development default in production');
  }
  return problems;
}
