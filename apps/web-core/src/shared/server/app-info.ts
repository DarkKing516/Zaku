import 'server-only';
import packageJson from '../../../package.json';
import { appEnvironment, type Env } from './env';

type AppEnvironment = NonNullable<Env['APP_ENV']>;

const ENVIRONMENT_LABELS: Record<AppEnvironment, string | null> = {
  local: 'Local',
  dev: 'Desarrollo',
  cert: 'Certificación',
  qa: 'Calidad (QA)',
  prod: null,
};

export function getAppInfo(): { version: string; environment: string | null } {
  const environment = appEnvironment();
  return { version: packageJson.version, environment: environment ? ENVIRONMENT_LABELS[environment] : null };
}
