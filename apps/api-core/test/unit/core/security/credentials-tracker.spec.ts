import { credentialsTracker } from '@core/security/credentials-tracker';

describe('credentialsTracker', () => {
  it('tracks credential attempts per tenant account regardless of the client IP', () => {
    const fromOneIp = credentialsTracker({
      ip: '10.0.0.1',
      headers: { 'x-tenant-id': '0A000000-0000-4000-8000-00000000000A' },
      body: { email: ' Jane@Example.com ' },
    });
    const fromAnotherIp = credentialsTracker({
      ip: '10.0.0.2',
      headers: { 'x-tenant-id': '0a000000-0000-4000-8000-00000000000a' },
      body: { email: 'jane@example.com' },
    });

    expect(fromOneIp).toBe('account:0a000000-0000-4000-8000-00000000000a:jane@example.com');
    expect(fromAnotherIp).toBe(fromOneIp);
  });

  it('falls back to the client IP when the body has no email', () => {
    expect(credentialsTracker({ ip: '10.0.0.1', headers: {}, body: {} })).toBe('ip:10.0.0.1');
    expect(credentialsTracker({ headers: {}, body: 'not-json' })).toBe('ip:unknown');
  });
});
