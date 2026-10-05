import 'server-only';
import { env } from '../env';
import { logger } from '../logger';
import type { Result } from './result';

export async function mock<T>(label: string, produce: () => Result<T>): Promise<Result<T>> {
  const { MOCK_LATENCY_MS } = env();
  if (MOCK_LATENCY_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  }
  const result = produce();
  logger.info('mock', `${label} -> ${result.ok ? 'ok' : `error ${result.error.status}`}`);
  return result;
}
