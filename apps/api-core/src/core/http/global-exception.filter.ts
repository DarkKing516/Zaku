import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { inspect } from 'node:util';
import type { ApiErrorDetail } from '@zaku/shared-types';
import { AppError } from '@common/errors/app-error';
import { isTransientDatabaseError } from '../database/postgres-errors';
import { HTTP_STATUS_BY_ERROR_CATEGORY } from './error-category-status';
import { buildErrorEnvelope, currentRequestId } from './response-envelope';

interface FailureDescription {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string;
  readonly details: readonly ApiErrorDetail[];
}

const INTERNAL_FAILURE: FailureDescription = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
  details: [],
};

const DATABASE_UNAVAILABLE_FAILURE: FailureDescription = {
  statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  code: 'DATABASE_UNAVAILABLE',
  message: 'The database is temporarily unavailable',
  details: [],
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = currentRequestId(request);
    const failure = describeFailure(exception);

    if (isServerError(failure.statusCode)) {
      this.logger.error(`[${requestId}] ${request.method} ${request.originalUrl} failed`, stackWithCauses(exception));
    }

    if (response.headersSent) {
      return;
    }

    response
      .status(failure.statusCode)
      .json(buildErrorEnvelope({ ...failure, requestId, path: request.originalUrl }));
  }
}

function isServerError(statusCode: number): boolean {
  return statusCode >= 500;
}

export function describeFailure(exception: unknown): FailureDescription {
  if (exception instanceof AppError) {
    return {
      statusCode: HTTP_STATUS_BY_ERROR_CATEGORY[exception.category],
      code: exception.code,
      message: exception.message,
      details: exception.details,
    };
  }

  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const messages = messagesOf(exception.getResponse());
    return {
      statusCode,
      code: HttpStatus[statusCode] ?? 'HTTP_ERROR',
      message: messages.length === 1 ? messages[0] : exception.message,
      details: messages.length > 1 ? messages.map((message) => ({ message })) : [],
    };
  }

  if (isTransientDatabaseError(exception)) {
    return DATABASE_UNAVAILABLE_FAILURE;
  }

  if (isExposedClientError(exception)) {
    return {
      statusCode: exception.status,
      code: HttpStatus[exception.status] ?? 'HTTP_ERROR',
      message: exception.message,
      details: [],
    };
  }

  return INTERNAL_FAILURE;
}

interface ExposedClientError {
  readonly status: number;
  readonly message: string;
  readonly expose: true;
}

function isExposedClientError(exception: unknown): exception is ExposedClientError {
  if (!(exception instanceof Error) || !('status' in exception) || !('expose' in exception)) {
    return false;
  }
  const { status, expose } = exception;
  return expose === true && typeof status === 'number' && status >= 400 && status < 500;
}

function messagesOf(responseBody: string | object): string[] {
  if (typeof responseBody === 'string') {
    return [responseBody];
  }
  const message: unknown = 'message' in responseBody ? responseBody.message : undefined;
  if (Array.isArray(message)) {
    return message.map(String);
  }
  return typeof message === 'string' ? [message] : [];
}

function stackWithCauses(exception: unknown): string {
  const lines: string[] = [];
  let current: unknown = exception;
  while (current instanceof Error) {
    lines.push(current.stack ?? `${current.name}: ${current.message}`);
    current = current.cause;
  }
  if (current !== undefined && lines.length === 0) {
    lines.push(inspect(current));
  }
  return lines.join('\nCaused by: ');
}
