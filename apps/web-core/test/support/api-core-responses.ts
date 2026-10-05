import type { ApiErrorResponse, ApiSuccessResponse, PaginationMeta } from '@zaku/shared-types';

const META = { requestId: 'request-1', timestamp: '2026-10-01T00:00:00.000Z' };

export function successEnvelope<T>(data: T, pagination?: PaginationMeta): ApiSuccessResponse<T> {
  return { success: true, statusCode: 200, message: 'OK', data, meta: pagination ? { ...META, pagination } : META };
}

export function errorEnvelope(statusCode: number, code: string, message: string, details: ApiErrorResponse['error']['details'] = []): ApiErrorResponse {
  return {
    success: false,
    statusCode,
    message,
    data: null,
    error: { code, details },
    errorImage: `https://http.cat/${statusCode}`,
    meta: META,
  };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
