import { getServerServiceContext } from '@/shared/server/next-context';
import { activeSessionData, fakeSession, type FakeSession } from '@test/support/fake-session';

const mockGetSession = jest.fn<Promise<FakeSession>, []>();
jest.mock('@/shared/server/session', () => ({ getSession: () => mockGetSession() }));
jest.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.7' }) }));

describe('getServerServiceContext', () => {
  it('builds the service context of a Server Component from the session and the request headers', async () => {
    mockGetSession.mockResolvedValue(fakeSession(activeSessionData()));

    await expect(getServerServiceContext()).resolves.toMatchObject({
      ip: '203.0.113.7',
      tenantId: activeSessionData().user?.tenantId,
      accessToken: 'session-access-token',
    });
  });

  it('carries no identity for an anonymous visitor', async () => {
    mockGetSession.mockResolvedValue(fakeSession());

    await expect(getServerServiceContext()).resolves.toMatchObject({ tenantId: undefined, accessToken: undefined });
  });
});
