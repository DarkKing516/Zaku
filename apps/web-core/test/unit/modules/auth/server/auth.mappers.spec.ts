import { toEstablishedSession } from '@/modules/auth/server/auth.mappers';

describe('toEstablishedSession', () => {
  it('keeps only browser-safe user fields and expires with the access token', () => {
    const established = toEstablishedSession(
      {
        accessToken: 'jwt',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { id: 'user-1', tenantId: 'tenant-1', email: 'demo@zaku.dev', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      },
      1_000,
    );

    expect(established).toEqual({ user: { id: 'user-1', email: 'demo@zaku.dev', tenantId: 'tenant-1' }, accessToken: 'jwt', expiresAt: 3_601_000 });
  });
});
