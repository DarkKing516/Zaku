import { isActiveSession, SESSION_COOKIE, sessionOptions } from '@/shared/server/session-options';
import { ACTIVE_USER } from '@test/support/fake-session';

describe('isActiveSession', () => {
  const now = 1_000_000;

  it('requires a user', () => {
    expect(isActiveSession({}, now)).toBe(false);
  });

  it('expires together with the access token', () => {
    expect(isActiveSession({ user: ACTIVE_USER, expiresAt: now + 1 }, now)).toBe(true);
    expect(isActiveSession({ user: ACTIVE_USER, expiresAt: now }, now)).toBe(false);
  });

  it('accepts a session without an expiry', () => {
    expect(isActiveSession({ user: ACTIVE_USER }, now)).toBe(true);
  });
});

describe('sessionOptions', () => {
  it('uses an httpOnly, SameSite=Lax cookie with the configured ttl', () => {
    expect(sessionOptions()).toMatchObject({
      cookieName: SESSION_COOKIE,
      ttl: 3600,
      cookieOptions: { httpOnly: true, sameSite: 'lax', secure: false, path: '/' },
    });
  });
});
