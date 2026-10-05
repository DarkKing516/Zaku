import 'server-only';
import type { ApiErrorDetail, ApiSuccessResponse, PaginationMeta } from '@zaku/shared-types';
import { env } from '../env';
import { logger } from '../logger';
import type { ServiceContext } from '../service-context';
import { apis, type ApiName, type ApiVersion } from './apis';
import { fail, mapResult, ok, type ErrorModel, type Result } from './result';

type QueryValue = string | number | boolean | undefined;
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface BaseRequest {
  readonly context: ServiceContext;
  readonly api: ApiName;
  readonly controller: string;
  readonly action: string;
  readonly version?: ApiVersion;
  readonly withAuth?: boolean;
  readonly tenantId?: string;
  readonly urlParams?: readonly (string | number)[];
  readonly timeoutMs?: number;
}

export interface GetRequest extends BaseRequest {
  readonly queryParams?: Readonly<Record<string, QueryValue>>;
}

export interface BodyRequest<TBody> extends BaseRequest {
  readonly data?: TBody;
}

export interface Paged<T> {
  readonly items: T[];
  readonly pagination: PaginationMeta;
}

type Envelope = ApiSuccessResponse<unknown>;

export const http = {
  get: <T>(request: GetRequest) => sendForData<T>('GET', request),
  getPage: <T>(request: GetRequest) => sendForPage<T>('GET', request),
  post: <T, TBody = unknown>(request: BodyRequest<TBody>) => sendForData<T>('POST', request, request.data),
  put: <T, TBody = unknown>(request: BodyRequest<TBody>) => sendForData<T>('PUT', request, request.data),
  patch: <T, TBody = unknown>(request: BodyRequest<TBody>) => sendForData<T>('PATCH', request, request.data),
  delete: <T>(request: GetRequest) => sendForData<T>('DELETE', request),
};

async function sendForData<T>(method: Method, request: GetRequest | BodyRequest<unknown>, body?: unknown): Promise<Result<T>> {
  return mapResult(await send(method, request, body), (envelope) => envelope.data as T);
}

async function sendForPage<T>(method: Method, request: GetRequest): Promise<Result<Paged<T>>> {
  const result = await send(method, request);
  if (!result.ok) {
    return result;
  }
  const { data, meta } = result.data;
  if (!Array.isArray(data) || !meta.pagination) {
    logger.error('http', `${labelOf(method, request)} did not return a paginated envelope`);
    return fail(502, 'Respuesta inválida del servicio', 'UPSTREAM_INVALID_RESPONSE');
  }
  return ok({ items: data as T[], pagination: meta.pagination });
}

function resolveUrl(request: GetRequest): Result<URL> {
  const version = request.version ?? 'v1';
  const api = apis.find((candidate) => candidate.name === request.api);
  const controller = api?.controllers.find((candidate) => candidate.name === request.controller);
  const action = controller?.actions.find((candidate) => candidate.endpoint === request.action && candidate.version === version);

  if (!api || !controller || !action) {
    logger.error('http', 'API, controller or action is not registered in apis.ts', {
      api: request.api,
      controller: request.controller,
      action: request.action,
      version,
    });
    return fail(500, 'Servicio no disponible', 'API_NOT_REGISTERED');
  }

  const baseUrl = env()[api.urlEnv];
  if (!baseUrl) {
    logger.error('http', `${api.urlEnv} is missing: the service is in REAL mode but its API is not configured`);
    return fail(500, 'Servicio no disponible', 'API_NOT_CONFIGURED');
  }

  const segments = [version, controller.name, action.endpoint, ...(request.urlParams ?? []).map((param) => encodeURIComponent(String(param)))];
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/${segments.filter(Boolean).join('/')}`);
  for (const [key, value] of Object.entries(request.queryParams ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return ok(url);
}

function headersFor(request: BaseRequest, hasBody: boolean): Result<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json', 'x-request-id': request.context.requestId };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (request.tenantId) {
    headers['x-tenant-id'] = request.tenantId;
  }
  if (request.withAuth) {
    if (!request.context.accessToken) {
      return fail(401, 'Tu sesión expiró. Inicia sesión nuevamente.', 'UNAUTHENTICATED');
    }
    headers.Authorization = `Bearer ${request.context.accessToken}`;
  }
  return ok(headers);
}

async function send(method: Method, request: GetRequest | BodyRequest<unknown>, body?: unknown): Promise<Result<Envelope>> {
  const url = resolveUrl(request);
  if (!url.ok) {
    return url;
  }
  const headers = headersFor(request, body !== undefined);
  if (!headers.ok) {
    return headers;
  }

  const label = labelOf(method, request);
  const startedAt = performance.now();
  try {
    const response = await fetch(url.data, {
      method,
      headers: headers.data,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(request.timeoutMs ?? env().HTTP_TIMEOUT_MS),
      cache: 'no-store',
    });
    const payload = parseJson(await response.text());
    const elapsedMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      logger.warn('http', `${label} -> ${response.status} (${elapsedMs}ms)`, { url: url.data.toString(), payload });
      return { ok: false, error: normalizeError(response.status, payload, response.statusText) };
    }
    if (!isSuccessEnvelope(payload)) {
      logger.error('http', `${label} -> ${response.status} without the standard envelope`, { url: url.data.toString() });
      return fail(502, 'Respuesta inválida del servicio', 'UPSTREAM_INVALID_RESPONSE');
    }
    logger.info('http', `${label} -> ${response.status} (${elapsedMs}ms)`);
    return ok(payload);
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    logger.error('http', `${label} -> ${timedOut ? 'timeout' : 'unreachable'}`, { url: url.data.toString(), error: String(error) });
    return timedOut
      ? fail(504, 'El servicio tardó demasiado en responder', 'UPSTREAM_TIMEOUT')
      : fail(502, 'No fue posible contactar el servicio', 'UPSTREAM_UNREACHABLE');
  }
}

const labelOf = (method: Method, request: BaseRequest) => `${method} ${request.api}/${request.controller}/${request.action}`;

function parseJson(text: string): unknown {
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isSuccessEnvelope(payload: unknown): payload is Envelope {
  return typeof payload === 'object' && payload !== null && 'success' in payload && payload.success === true && 'meta' in payload;
}

function normalizeError(status: number, payload: unknown, statusText: string): ErrorModel {
  const body = (typeof payload === 'object' && payload !== null ? payload : {}) as {
    message?: unknown;
    error?: { code?: unknown; details?: readonly ApiErrorDetail[] };
  };
  const fields = Object.fromEntries(
    (body.error?.details ?? []).filter((detail) => detail.field).map((detail) => [detail.field as string, detail.message]),
  );
  return {
    status,
    code: typeof body.error?.code === 'string' ? body.error.code : `HTTP_${status}`,
    message: typeof body.message === 'string' ? body.message : statusText || 'Error',
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}
