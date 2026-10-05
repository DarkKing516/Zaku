import { http } from '@/shared/server/http/http-request';
import { errorEnvelope, jsonResponse, successEnvelope } from '@test/support/api-core-responses';
import { serviceContext } from '@test/support/service-context.fixture';

describe('http (server to api-core)', () => {
  let fetchSpy: jest.SpyInstance<Promise<Response>, Parameters<typeof fetch>>;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const sentRequest = () => {
    const [url, init] = fetchSpy.mock.calls[0];
    return { url: (url as URL).toString(), init: init ?? {}, headers: (init?.headers ?? {}) as Record<string, string> };
  };

  it('builds the URL from the registry and unwraps the envelope data', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, successEnvelope({ accessToken: 'jwt' })));

    const result = await http.post<{ accessToken: string }>({
      context: serviceContext(),
      api: 'Core',
      controller: 'user-auth',
      action: 'login',
      tenantId: 'tenant-1',
      data: { email: 'demo@zaku.dev' },
    });

    expect(result).toEqual({ ok: true, data: { accessToken: 'jwt' } });
    const { url, init, headers } = sentRequest();
    expect(url).toBe('http://api-core.test/api/v1/user-auth/login');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ email: 'demo@zaku.dev' }));
    expect(headers).toMatchObject({ 'x-request-id': 'request-1', 'x-tenant-id': 'tenant-1', 'Content-Type': 'application/json' });
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('sends the session token and the query string for authenticated reads', async () => {
    const pagination = { page: 2, pageSize: 10, totalItems: 12, totalPages: 2 };
    fetchSpy.mockResolvedValue(jsonResponse(200, successEnvelope([{ id: 'user-1' }], pagination)));

    const result = await http.getPage<{ id: string }>({
      context: serviceContext({ accessToken: 'session-token' }),
      api: 'Core',
      controller: 'users',
      action: '',
      withAuth: true,
      queryParams: { page: 2, pageSize: 10, search: undefined },
    });

    expect(result).toEqual({ ok: true, data: { items: [{ id: 'user-1' }], pagination } });
    const { url, headers } = sentRequest();
    expect(url).toBe('http://api-core.test/api/v1/users?page=2&pageSize=10');
    expect(headers.Authorization).toBe('Bearer session-token');
  });

  it('refuses an authenticated call without a session token, before reaching the network', async () => {
    const result = await http.get({ context: serviceContext(), api: 'Core', controller: 'users', action: '', withAuth: true });

    expect(result).toMatchObject({ ok: false, error: { status: 401, code: 'UNAUTHENTICATED' } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('normalizes the api-core error envelope, including field details', async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(400, errorEnvelope(400, 'VALIDATION_FAILED', 'Invalid request', [{ field: 'email', message: 'email must be an email' }, { message: 'general' }])),
    );

    const result = await http.post({ context: serviceContext(), api: 'Core', controller: 'user-auth', action: 'login', data: {} });

    expect(result).toEqual({
      ok: false,
      error: { status: 400, code: 'VALIDATION_FAILED', message: 'Invalid request', fields: { email: 'email must be an email' } },
    });
  });

  it('falls back to the HTTP status when the error body is not an envelope', async () => {
    fetchSpy.mockResolvedValue(new Response('Bad gateway', { status: 502, statusText: 'Bad Gateway' }));

    const result = await http.get({ context: serviceContext(), api: 'Core', controller: 'users', action: '' });

    expect(result).toEqual({ ok: false, error: { status: 502, code: 'HTTP_502', message: 'Bad Gateway' } });
  });

  it('rejects a 2xx answer without the standard envelope', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, { unexpected: true }));

    const result = await http.get({ context: serviceContext(), api: 'Core', controller: 'users', action: '' });

    expect(result).toMatchObject({ ok: false, error: { status: 502, code: 'UPSTREAM_INVALID_RESPONSE' } });
  });

  it('rejects a paginated read whose envelope carries no pagination', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, successEnvelope([{ id: 'user-1' }])));

    const result = await http.getPage({ context: serviceContext(), api: 'Core', controller: 'users', action: '' });

    expect(result).toMatchObject({ ok: false, error: { code: 'UPSTREAM_INVALID_RESPONSE' } });
  });

  it('maps timeouts and unreachable servers to gateway errors without leaking the URL', async () => {
    fetchSpy.mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'));
    fetchSpy.mockRejectedValueOnce(new TypeError('fetch failed'));
    const request = { context: serviceContext(), api: 'Core', controller: 'users', action: '' } as const;

    const timedOut = await http.get(request);
    const unreachable = await http.get(request);

    expect(timedOut).toEqual({ ok: false, error: { status: 504, code: 'UPSTREAM_TIMEOUT', message: 'El servicio tardó demasiado en responder', fields: undefined } });
    expect(unreachable).toMatchObject({ ok: false, error: { status: 502, code: 'UPSTREAM_UNREACHABLE' } });
    expect(JSON.stringify([timedOut, unreachable])).not.toContain('api-core.test');
  });

  it('fails closed when the action is not registered', async () => {
    const result = await http.get({ context: serviceContext(), api: 'Core', controller: 'users', action: 'unknown' });

    expect(result).toMatchObject({ ok: false, error: { status: 500, code: 'API_NOT_REGISTERED' } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fails closed when the API base URL is not configured', async () => {
    const previousUrl = process.env.API_CORE_URL;
    delete process.env.API_CORE_URL;
    try {
      await jest.isolateModulesAsync(async () => {
        const isolated = await import('@/shared/server/http/http-request');

        const result = await isolated.http.get({ context: serviceContext(), api: 'Core', controller: 'users', action: '' });

        expect(result).toMatchObject({ ok: false, error: { status: 500, code: 'API_NOT_CONFIGURED' } });
      });
    } finally {
      process.env.API_CORE_URL = previousUrl;
    }
  });
});
