import { clientIpOf, createServiceContext } from '@/shared/server/service-context';

describe('clientIpOf', () => {
  it('prefers the first x-forwarded-for address, then x-real-ip, then a neutral default', () => {
    expect(clientIpOf(new Headers({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2' }))).toBe('10.0.0.1');
    expect(clientIpOf(new Headers({ 'x-real-ip': '10.0.0.3' }))).toBe('10.0.0.3');
    expect(clientIpOf(new Headers())).toBe('0.0.0.0');
  });
});

describe('createServiceContext', () => {
  it('carries the request id and the session identity', () => {
    const context = createServiceContext(new Headers(), { tenantId: 'tenant-1', accessToken: 'token' }, 'request-7');

    expect(context).toEqual({ requestId: 'request-7', ip: '0.0.0.0', tenantId: 'tenant-1', accessToken: 'token' });
  });

  it('generates a request id when none is given', () => {
    expect(createServiceContext(new Headers()).requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
