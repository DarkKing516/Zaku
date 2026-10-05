import 'server-only';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie/i;
const MAX_REDACTION_DEPTH = 4;

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== 'object' || depth > MAX_REDACTION_DEPTH) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(nested, depth + 1),
    ]),
  );
}

function write(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): void {
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (meta) {
    sink(line, redact(meta));
  } else {
    sink(line);
  }
}

export const logger = {
  debug: (scope: string, message: string, meta?: Record<string, unknown>) => write('debug', scope, message, meta),
  info: (scope: string, message: string, meta?: Record<string, unknown>) => write('info', scope, message, meta),
  warn: (scope: string, message: string, meta?: Record<string, unknown>) => write('warn', scope, message, meta),
  error: (scope: string, message: string, meta?: Record<string, unknown>) => write('error', scope, message, meta),
};
