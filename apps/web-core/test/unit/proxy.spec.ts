import { NextRequest, type NextResponse } from 'next/server';
import { proxy } from '@/proxy';
import { SESSION_COOKIE, type SessionData } from '@/shared/server/session-options';
import { activeSessionData } from '@test/support/fake-session';

// iron-session 9 ships ESM only; the cookie sealing itself is covered by running the app, here only the routing decisions matter.
const mockSessions = new Map<string, SessionData>();
jest.mock('iron-session', () => ({
  nextProxyCookies: (request: NextRequest, response: NextResponse) => ({ request, response }),
  getIronSession: async ({ request, response }: { request: NextRequest; response: NextResponse }) => {
    const sealed = request.cookies.get(SESSION_COOKIE)?.value;
    return {
      ...(sealed ? mockSessions.get(sealed) : undefined),
      destroy: () => response.cookies.set(SESSION_COOKIE, '', { maxAge: 0 }),
    };
  },
}));

function requestTo(path: string, session?: SessionData): NextRequest {
  const headers = new Headers();
  if (session) {
    const sealed = `sealed-${mockSessions.size}`;
    mockSessions.set(sealed, session);
    headers.set('cookie', `${SESSION_COOKIE}=${sealed}`);
  }
  return new NextRequest(new URL(path, 'http://localhost:3001'), { headers });
}

const redirectTarget = (response: Response) => response.headers.get('location');

describe('proxy', () => {
  it('sends anonymous visitors of private pages to the login, remembering where they were going', async () => {
    const response = await proxy(requestTo('/users?page=2'));

    expect(redirectTarget(response)).toBe('http://localhost:3001/login?next=%2Fusers%3Fpage%3D2');
  });

  it.each(['/', '/login'])('lets anonymous visitors open the public page %s', async (path) => {
    const response = await proxy(requestTo(path));

    expect(redirectTarget(response)).toBeNull();
  });

  it('lets an active session through and keeps it away from the login page', async () => {
    const privatePage = await proxy(requestTo('/home', activeSessionData()));
    const loginPage = await proxy(requestTo('/login', activeSessionData()));

    expect(redirectTarget(privatePage)).toBeNull();
    expect(redirectTarget(loginPage)).toBe('http://localhost:3001/home');
  });

  it('treats a session whose token expired as anonymous and clears its cookie on the redirect', async () => {
    const response = await proxy(requestTo('/home', { ...activeSessionData(), expiresAt: Date.now() - 1 }));

    expect(redirectTarget(response)).toBe('http://localhost:3001/login?next=%2Fhome');
    expect(response.headers.get('set-cookie')).toMatch(new RegExp(`${SESSION_COOKIE}=;`));
  });

  it('clears an expired session cookie when the visitor lands on the login page', async () => {
    const response = await proxy(requestTo('/login', { ...activeSessionData(), expiresAt: Date.now() - 1 }));

    expect(redirectTarget(response)).toBeNull();
    expect(response.headers.get('set-cookie')).toMatch(new RegExp(`${SESSION_COOKIE}=;`));
  });
});
