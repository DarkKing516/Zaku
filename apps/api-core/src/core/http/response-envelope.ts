import { Request } from 'express';
import { STATUS_CODES } from 'node:http';
import type { ApiErrorDetail, ApiErrorResponse, ApiSuccessResponse } from '@zaku/shared-types';
import { Page } from '@common/pagination/page';
import { RequestContext } from '../request-context/request-context';
import { REQUEST_ID_HEADER, resolveRequestId } from '../request-context/request-context.middleware';

export interface SuccessEnvelopeInput {
  readonly result: unknown;
  readonly statusCode: number;
  readonly message?: string;
  readonly requestId: string;
}

export interface ErrorEnvelopeInput {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string;
  readonly details: readonly ApiErrorDetail[];
  readonly requestId: string;
  readonly path: string;
}

export function currentRequestId(request: Request): string {
  return RequestContext.current()?.requestId ?? resolveRequestId(request.header(REQUEST_ID_HEADER));
}

export function defaultMessageFor(statusCode: number): string {
  return STATUS_CODES[statusCode] ?? 'Unknown Status';
}

export function buildSuccessEnvelope(input: SuccessEnvelopeInput): ApiSuccessResponse<unknown> {
  const timestamp = new Date().toISOString();
  const base = {
    success: true as const,
    statusCode: input.statusCode,
    message: input.message ?? defaultMessageFor(input.statusCode),
  };

  if (input.result instanceof Page) {
    const page = input.result;
    return {
      ...base,
      data: page.items,
      meta: {
        requestId: input.requestId,
        timestamp,
        pagination: {
          page: page.page,
          pageSize: page.pageSize,
          totalItems: page.totalItems,
          totalPages: page.totalPages,
        },
      },
    };
  }

  return { ...base, data: input.result ?? null, meta: { requestId: input.requestId, timestamp } };
}

export function buildErrorEnvelope(input: ErrorEnvelopeInput): ApiErrorResponse {
  return {
    success: false,
    statusCode: input.statusCode,
    message: input.message,
    data: null,
    error: { code: input.code, details: [...input.details] },
    errorImage: `https://http.cat/${input.statusCode}`,
    meta: { requestId: input.requestId, timestamp: new Date().toISOString(), path: input.path },
  };
}
