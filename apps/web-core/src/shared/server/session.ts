import 'server-only';
import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LOGIN_ROUTE } from '../constants';
import type { SessionUser } from '../types/session-user';
import { isActiveSession, sessionOptions, type SessionData } from './session-options';

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!isActiveSession(session)) {
    redirect(LOGIN_ROUTE);
  }
  return session.user;
}
