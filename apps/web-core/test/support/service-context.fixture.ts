import type { ServiceContext } from '@/shared/server/service-context';

export function serviceContext(overrides: Partial<ServiceContext> = {}): ServiceContext {
  return { requestId: 'request-1', ip: '127.0.0.1', ...overrides };
}
