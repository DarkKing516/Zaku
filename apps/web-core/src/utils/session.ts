import AuthModel from '@/data/model/auth-model';
import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export const configIronSession: SessionOptions = {
  password: process.env.NEXT_PUBLIC_IRON_SESSION_SECRET_PASSWORD as string,
  cookieName: 'zaku-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export interface SessionData {
  user?: AuthModel;
}

export async function GetSession(): Promise<SessionData> {
  return await getIronSession<SessionData>(await cookies(), configIronSession);
}

export async function UpdateSession(data: Partial<SessionData>) {
  const session = await getIronSession<SessionData>(await cookies(), configIronSession);
  Object.assign(session, data);
  await session.save();
}

export async function DestroySession() {
  const session = await getIronSession<SessionData>(await cookies(), configIronSession);
  session.destroy();
}
