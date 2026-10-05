import { getSession, requireUser } from '@/shared/server/session';
import { activeSessionData, fakeSession, type FakeSession } from '@test/support/fake-session';

const mockGetIronSession = jest.fn<Promise<FakeSession>, [unknown, unknown]>();
const mockRedirect = jest.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT ${path}`);
});
jest.mock('iron-session', () => ({ getIronSession: (cookies: unknown, options: unknown) => mockGetIronSession(cookies, options) }));
jest.mock('next/headers', () => ({ cookies: async () => 'cookie-store' }));
jest.mock('next/navigation', () => ({ redirect: (path: string) => mockRedirect(path) }));

describe('session', () => {
  it('opens the iron-session of the current request with the app cookie options', async () => {
    const session = fakeSession(activeSessionData());
    mockGetIronSession.mockResolvedValue(session);

    await expect(getSession()).resolves.toBe(session);
    expect(mockGetIronSession).toHaveBeenCalledWith('cookie-store', expect.objectContaining({ cookieName: 'zaku-session' }));
  });

  it('returns the user of an active session', async () => {
    mockGetIronSession.mockResolvedValue(fakeSession(activeSessionData()));

    await expect(requireUser()).resolves.toMatchObject({ email: 'demo@zaku.dev' });
  });

  it('redirects to the login page when there is no active session', async () => {
    mockGetIronSession.mockResolvedValue(fakeSession({ ...activeSessionData(), expiresAt: Date.now() - 1 }));

    await expect(requireUser()).rejects.toThrow('NEXT_REDIRECT /login');
  });
});
