import type { BffErrorBody } from '../types/api';
import { sessionAlert } from './session-alert';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Readonly<Record<string, string>>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

const BFF_PREFIX = '/api/';
const AUTH_PREFIX = '/api/auth/';

async function request<T>(method: string, path: string, { query, body, signal }: RequestOptions = {}): Promise<T> {
  if (!path.startsWith(BFF_PREFIX)) {
    throw new Error(`apiClient can only call the internal BFF (${BFF_PREFIX}*). Received: ${path}`);
  }

  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    throw new ApiError(0, 'NETWORK', 'No hay conexión con el servidor. Verifica tu red e intenta de nuevo.');
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = (payload as BffErrorBody | null)?.error;
    const error = new ApiError(response.status, failure?.code ?? `HTTP_${response.status}`, failure?.message ?? 'Ocurrió un error inesperado', failure?.fields);
    if (!path.startsWith(AUTH_PREFIX)) {
      notifySessionProblem(error);
    }
    throw error;
  }
  return payload as T;
}

function notifySessionProblem(error: ApiError): void {
  if (error.status === 401) {
    sessionAlert.show('EXPIRED', error.message);
  } else if (error.status === 403) {
    sessionAlert.show('FORBIDDEN', error.message);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) => request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) => request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) => request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('DELETE', path, options),
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  return new ApiError(0, 'UNKNOWN', error instanceof Error ? error.message : 'Ocurrió un error inesperado');
}
