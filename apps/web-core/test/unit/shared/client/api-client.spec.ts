/** @jest-environment jsdom */
import { ApiError, apiClient, toApiError } from '@/shared/client/api-client';
import { useSessionAlertStore } from '@/shared/client/session-alert';

const fakeResponse = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe('apiClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    useSessionAlertStore.getState().dismiss();
  });

  it('only talks to the internal BFF', async () => {
    await expect(apiClient.get('https://api.zaku.dev/users')).rejects.toThrow(/\/api\//);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends JSON bodies and drops empty query values', async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, { saved: true }));

    const data = await apiClient.post('/api/things', { name: 'zaku' }, { query: { page: 2, search: '', filter: null } });

    expect(data).toEqual({ saved: true });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe('http://localhost/api/things?page=2');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin', body: JSON.stringify({ name: 'zaku' }) });
  });

  it('turns BFF errors into ApiError with the stable code and field errors', async () => {
    fetchMock.mockResolvedValue(fakeResponse(400, { error: { code: 'VALIDATION', message: 'Revisa los datos', fields: { email: 'Inválido' } } }));

    const error = await apiClient.post('/api/things', {}).catch(toApiError);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION', message: 'Revisa los datos', fields: { email: 'Inválido' } });
  });

  it('raises the session alerts on 401 and 403 outside the auth endpoints', async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse(401, { error: { code: 'UNAUTHENTICATED', message: 'Sesión vencida' } }));
    await apiClient.get('/api/things').catch(() => undefined);
    expect(useSessionAlertStore.getState()).toMatchObject({ reason: 'EXPIRED', message: 'Sesión vencida' });

    fetchMock.mockResolvedValueOnce(fakeResponse(403, { error: { code: 'TENANT_UNAVAILABLE', message: 'Sin acceso' } }));
    await apiClient.get('/api/things').catch(() => undefined);
    expect(useSessionAlertStore.getState()).toMatchObject({ reason: 'FORBIDDEN', message: 'Sin acceso' });
  });

  it('does not raise a session alert for a failed login', async () => {
    fetchMock.mockResolvedValue(fakeResponse(401, { error: { code: 'USER_AUTH_INVALID_CREDENTIALS', message: 'Credenciales inválidas' } }));

    await apiClient.post('/api/auth/login', {}).catch(() => undefined);

    expect(useSessionAlertStore.getState().reason).toBeNull();
  });

  it('reports network failures with a friendly message', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiClient.get('/api/things')).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });
});

describe('toApiError', () => {
  it('wraps unknown failures', () => {
    expect(toApiError(new Error('boom'))).toMatchObject({ code: 'UNKNOWN', message: 'boom' });
    expect(toApiError('weird')).toMatchObject({ code: 'UNKNOWN', message: 'Ocurrió un error inesperado' });
  });
});
