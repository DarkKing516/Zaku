import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Request, Response } from 'express';

export interface FakeRequestInput {
  readonly headers?: Record<string, string>;
  readonly method?: string;
  readonly routePath?: string;
  readonly params?: Record<string, string>;
  readonly body?: unknown;
}

export function fakeRequest(input: FakeRequestInput = {}): Request {
  const headers = Object.fromEntries(
    Object.entries(input.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value]),
  );
  const request = {
    headers,
    method: input.method ?? 'POST',
    route: { path: input.routePath ?? '/api/v1/resources' },
    path: input.routePath ?? '/api/v1/resources',
    originalUrl: input.routePath ?? '/api/v1/resources',
    params: input.params ?? {},
    body: input.body ?? {},
    header: (name: string) => headers[name.toLowerCase()],
  };
  return request as unknown as Request;
}

export interface FakeResponse {
  statusCode: number;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

export function fakeResponse(statusCode = 200, { headersSent = false } = {}): Response & FakeResponse {
  const response = {
    statusCode,
    headersSent,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    setHeader(name: string, value: string) {
      response.headers[name] = value;
      return response;
    },
    json(body: unknown) {
      response.body = body;
      return response;
    },
  };
  return response as unknown as Response & FakeResponse;
}

export function httpExecutionContext(
  request: Request,
  controllerClass: abstract new (...args: never[]) => object,
  handler: (...args: never[]) => unknown,
  response: Response = fakeResponse(),
): ExecutionContextHost {
  const context = new ExecutionContextHost([request, response, () => undefined], controllerClass as never, handler);
  context.setType('http');
  return context;
}
