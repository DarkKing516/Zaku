import { z } from 'zod';
import { privateBff, publicBff } from '@/shared/server/bff/define-bff';
import { fail, ok } from '@/shared/server/http/result';
import { activeSessionData, fakeSession, type FakeSession } from '@test/support/fake-session';

const mockGetSession = jest.fn<Promise<FakeSession>, []>();
jest.mock('@/shared/server/session', () => ({ getSession: () => mockGetSession() }));

const routeContext = (params: Record<string, string> = {}) => ({ params: Promise.resolve(params) });

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost:3001/api/things?limit=5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', host: 'localhost:3001', ...headers },
    body: JSON.stringify(body),
  });
}

describe('defineBff', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue(fakeSession(activeSessionData()));
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('answers the service data as JSON with no-store and the request id', async () => {
    const handler = publicBff({ successStatus: 201 }, async () => ok({ created: true }));

    const response = await handler(post({}, { 'x-request-id': 'client-request-0001' }), routeContext());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ created: true });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-request-id')).toBe('client-request-0001');
  });

  it('replaces an unsafe incoming request id with a generated one', async () => {
    const handler = publicBff({}, async () => ok(null));

    const response = await handler(post({}, { 'x-request-id': 'bad id<script>' }), routeContext());

    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects private endpoints without an active session', async () => {
    const expired = { ...activeSessionData(), expiresAt: Date.now() - 1 };
    const handler = privateBff({}, async () => ok('secret data'));

    mockGetSession.mockResolvedValueOnce(fakeSession());
    const anonymous = await handler(post({}), routeContext());
    mockGetSession.mockResolvedValueOnce(fakeSession(expired));
    const withExpiredToken = await handler(post({}), routeContext());

    expect(anonymous.status).toBe(401);
    expect(withExpiredToken.status).toBe(401);
    await expect(anonymous.json()).resolves.toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  });

  it('passes the session identity to the service only for an active session', async () => {
    const seen: unknown[] = [];
    const handler = publicBff({}, async ({ service, user }) => {
      seen.push({ service, user });
      return ok(null);
    });

    await handler(post({}), routeContext());
    mockGetSession.mockResolvedValueOnce(fakeSession({ ...activeSessionData(), expiresAt: Date.now() - 1 }));
    await handler(post({}), routeContext());

    expect(seen[0]).toMatchObject({ service: { accessToken: 'session-access-token', tenantId: activeSessionData().user?.tenantId }, user: { email: 'demo@zaku.dev' } });
    expect(seen[1]).toMatchObject({ service: { accessToken: undefined, tenantId: undefined }, user: undefined });
  });

  it('blocks cross-origin writes but allows same-origin and non-browser clients', async () => {
    const handler = publicBff({}, async () => ok(null));

    const crossOrigin = await handler(post({}, { origin: 'https://evil.example' }), routeContext());
    const sameOrigin = await handler(post({}, { origin: 'http://localhost:3001' }), routeContext());
    const nonBrowser = await handler(post({}), routeContext());

    expect(crossOrigin.status).toBe(403);
    expect(sameOrigin.status).toBe(200);
    expect(nonBrowser.status).toBe(200);
  });

  it('validates the body and the query with the zod schemas before calling the service', async () => {
    const service = jest.fn(async () => ok(null));
    const handler = publicBff({ body: z.object({ name: z.string().min(3, 'Too short') }), query: z.object({ limit: z.coerce.number().max(3, 'Too many') }) }, service);

    const response = await handler(post({ name: 'ab' }), routeContext());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: { code: 'VALIDATION', message: 'Revisa los datos ingresados', fields: { limit: 'Too many' } } });
    expect(service).not.toHaveBeenCalled();
  });

  it('gives the handler the parsed body, query and route params', async () => {
    const handler = publicBff({ body: z.object({ name: z.string().trim() }), query: z.object({ limit: z.coerce.number() }) }, async ({ body, query, params }) =>
      ok({ body, query, params }),
    );

    const response = await handler(post({ name: '  zaku  ' }), routeContext({ id: '42' }));

    await expect(response.json()).resolves.toEqual({ body: { name: 'zaku' }, query: { limit: 5 }, params: { id: '42' } });
  });

  it('forwards client errors but hides the detail of server errors', async () => {
    const clientError = publicBff({}, async () => fail(409, 'Already exists', 'USER_ALREADY_EXISTS'));
    const serverError = publicBff({}, async () => fail(503, 'connect ECONNREFUSED 10.0.0.5:5432', 'UPSTREAM_UNREACHABLE'));

    const conflict = await (await clientError(post({}), routeContext())).json();
    const unavailable = await serverError(post({}), routeContext());

    expect(conflict).toEqual({ error: { code: 'USER_ALREADY_EXISTS', message: 'Already exists' } });
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toEqual({
      error: { code: 'UPSTREAM_UNREACHABLE', message: 'El servicio no está disponible. Intenta nuevamente en unos minutos.' },
    });
  });

  it('turns an unexpected exception into a masked 500', async () => {
    const handler = publicBff({}, async () => {
      throw new Error('database password is hunter2');
    });

    const response = await handler(post({}), routeContext());

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.not.toContain('hunter2');
  });
});
