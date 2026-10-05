import { demoCredentialsForLocalEnvironment, login, logout } from '@/modules/auth/server/auth.bff';
import { DEMO_TENANT_ID, DEMO_USER } from '@/shared/server/demo-fixtures';
import { withEnvironment } from '@test/support/environment';
import { activeSessionData, fakeSession, type FakeSession } from '@test/support/fake-session';

const mockGetSession = jest.fn<Promise<FakeSession>, []>();
const mockRememberTenant = jest.fn(async (_tenantId: string) => undefined);
jest.mock('@/shared/server/session', () => ({ getSession: () => mockGetSession() }));
jest.mock('@/modules/auth/server/remembered-tenant', () => ({ rememberTenant: (tenantId: string) => mockRememberTenant(tenantId) }));

const routeContext = { params: Promise.resolve({}) };

function loginRequest(body: unknown): Request {
  return new Request('http://localhost:3001/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

describe('auth BFF', () => {
  let session: FakeSession;

  beforeEach(() => {
    session = fakeSession();
    mockGetSession.mockResolvedValue(session);
    mockRememberTenant.mockClear();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens the session, remembers the tenant and never returns the access token', async () => {
    const response = await login(loginRequest({ tenantId: DEMO_TENANT_ID, email: DEMO_USER.email, password: DEMO_USER.password }), routeContext);

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({ id: DEMO_USER.id, email: DEMO_USER.email, tenantId: DEMO_TENANT_ID });
    expect(JSON.stringify(body)).not.toContain('mock-access-token');
    expect(session).toMatchObject({ user: { id: DEMO_USER.id }, accessToken: `mock-access-token.${DEMO_USER.id}`, expiresAt: expect.any(Number) });
    expect(session.save).toHaveBeenCalled();
    expect(mockRememberTenant).toHaveBeenCalledWith(DEMO_TENANT_ID);
  });

  it('leaves the session untouched when the credentials are rejected', async () => {
    const response = await login(loginRequest({ tenantId: DEMO_TENANT_ID, email: DEMO_USER.email, password: 'wrong' }), routeContext);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'USER_AUTH_INVALID_CREDENTIALS' } });
    expect(session.save).not.toHaveBeenCalled();
    expect(mockRememberTenant).not.toHaveBeenCalled();
  });

  it('destroys the session on logout', async () => {
    session = fakeSession(activeSessionData());
    mockGetSession.mockResolvedValue(session);

    const response = await logout(new Request('http://localhost:3001/api/auth/logout', { method: 'POST' }), routeContext);

    await expect(response.json()).resolves.toEqual({ loggedOut: true });
    expect(session.destroy).toHaveBeenCalled();
    expect(session.user).toBeUndefined();
  });
});

describe('demoCredentialsForLocalEnvironment', () => {
  it('offers the demo account only on the local environment', () => {
    expect(demoCredentialsForLocalEnvironment()).toEqual({ tenantId: DEMO_TENANT_ID, email: DEMO_USER.email, password: DEMO_USER.password });
    withEnvironment({ APP_ENV: 'dev' }, () => {
      expect(demoCredentialsForLocalEnvironment()).toBeUndefined();
    });
  });
});
