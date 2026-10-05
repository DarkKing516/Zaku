import type { IronSession } from 'iron-session';
import type { SessionData } from '@/shared/server/session-options';

export type FakeSession = IronSession<SessionData> & { save: jest.Mock; destroy: jest.Mock };

export function fakeSession(data: SessionData = {}): FakeSession {
  const session = {
    ...data,
    save: jest.fn(async () => undefined),
    destroy: jest.fn(() => {
      delete session.user;
      delete session.accessToken;
      delete session.expiresAt;
    }),
    updateConfig: jest.fn(),
  };
  return session;
}

export const ACTIVE_USER = {
  id: '00000000-0000-4000-8000-000000000101',
  email: 'demo@zaku.dev',
  tenantId: '00000000-0000-4000-8000-000000000001',
} as const;

export const activeSessionData = (now = Date.now()): SessionData => ({
  user: ACTIVE_USER,
  accessToken: 'session-access-token',
  expiresAt: now + 60_000,
});
