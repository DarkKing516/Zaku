import 'server-only';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['local', 'dev', 'cert', 'qa', 'prod']).optional(),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must have at least 32 characters'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(8 * 60 * 60),
  SESSION_COOKIE_SECURE: z.enum(['true', 'false']).optional(),

  MOCK_LATENCY_MS: z.coerce.number().int().min(0).default(350),
  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),

  API_CORE_URL: z.url({ protocol: /^https?$/ }).optional(),
});

export type Env = z.infer<typeof environmentSchema>;

export function parseEnvironment(rawEnvironment: Readonly<Record<string, string | undefined>>): Env {
  const definedValues = Object.fromEntries(Object.entries(rawEnvironment).filter(([, value]) => value !== ''));
  const parsed = environmentSchema.safeParse(definedValues);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment variables -> ${issues}`);
  }
  return parsed.data;
}

let cachedEnvironment: Env | undefined;

// Lazy so that `next build` does not demand secrets that only exist at runtime.
export function env(): Env {
  cachedEnvironment ??= parseEnvironment(process.env);
  return cachedEnvironment;
}

export const isProduction = () => env().NODE_ENV === 'production';

// Parsed on its own so statically rendered pages can show the environment without demanding runtime secrets.
export function appEnvironment(rawValue = process.env.APP_ENV): Env['APP_ENV'] {
  const parsed = environmentSchema.shape.APP_ENV.safeParse(rawValue === '' ? undefined : rawValue);
  return parsed.success ? parsed.data : undefined;
}

export const isLocalEnvironment = () => appEnvironment() === 'local';
