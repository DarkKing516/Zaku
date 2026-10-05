import 'server-only';
import type { SessionOptions } from 'iron-session';
import type { SessionUser } from '../types/session-user';
import { env, isProduction } from './env';

export interface SessionData {
  user?: SessionUser;
  accessToken?: string;
  expiresAt?: number;
}

export const SESSION_COOKIE = 'zaku-session';

export function sessionOptions(): SessionOptions {
  const { SESSION_SECRET, SESSION_TTL_SECONDS, SESSION_COOKIE_SECURE } = env();
  return {
    cookieName: SESSION_COOKIE,
    password: SESSION_SECRET,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: SESSION_COOKIE_SECURE ? SESSION_COOKIE_SECURE === 'true' : isProduction(),
      path: '/',
    },
  };
}

export function isActiveSession(session: SessionData, now = Date.now()): session is SessionData & { user: SessionUser } {
  return session.user !== undefined && (session.expiresAt === undefined || session.expiresAt > now);
}
