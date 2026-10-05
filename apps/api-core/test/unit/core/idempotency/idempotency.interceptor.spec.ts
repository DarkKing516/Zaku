import { CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, Subject, firstValueFrom, of, throwError } from 'rxjs';
import { IdempotencyStorePort } from '@core/idempotency/idempotency-store.port';
import {
  IdempotencyKeyInvalidError,
  IdempotencyKeyRequiredError,
  IdempotencyKeyReusedError,
  IdempotencyRequestInProgressError,
  IdempotencyStoreUnavailableError,
} from '@core/idempotency/idempotency.errors';
import { IdempotencyInterceptor } from '@core/idempotency/idempotency.interceptor';
import { Idempotent } from '@core/idempotency/idempotent.decorator';
import { InMemoryIdempotencyStore } from '@core/idempotency/in-memory-idempotency.store';
import { RequestContext } from '@core/request-context/request-context';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { fakeRequest, fakeResponse, httpExecutionContext } from '@test/support/http-execution-context';

class ResourcesController {
  @Idempotent()
  createOptional(): void {}

  @Idempotent({ required: true })
  createRequired(): void {}
}

const IDEMPOTENCY_KEY = 'b9e7c1f0-0000-4000-8000-000000000001';

interface Call {
  readonly handler: (...args: never[]) => unknown;
  readonly key?: string;
  readonly body?: unknown;
  readonly next: CallHandler<unknown>;
}

describe('IdempotencyInterceptor', () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  function interceptorWith(idempotencyStore: IdempotencyStorePort): IdempotencyInterceptor {
    return new IdempotencyInterceptor(new Reflector(), idempotencyStore, buildAppConfig());
  }

  function handlerReturning(body: unknown, counter?: { calls: number }): CallHandler<unknown> {
    return {
      handle: () => {
        if (counter) {
          counter.calls += 1;
        }
        return of(body);
      },
    };
  }

  async function invoke(call: Call, interceptor = interceptorWith(store)) {
    const response = fakeResponse(201);
    const request = fakeRequest({
      headers: call.key ? { 'idempotency-key': call.key } : {},
      body: call.body ?? { name: 'acme' },
    });
    const context = httpExecutionContext(request, ResourcesController, call.handler, response);
    const body = await RequestContext.run({ requestId: 'test' }, async () =>
      firstValueFrom(await interceptor.intercept(context, call.next)),
    );
    return { body, response };
  }

  it('lets requests without a key through on optional routes', async () => {
    const { body } = await invoke({ handler: ResourcesController.prototype.createOptional, next: handlerReturning({ id: 1 }) });

    expect(body).toEqual({ id: 1 });
  });

  it('demands a key on required routes and validates its format', async () => {
    await expect(
      invoke({ handler: ResourcesController.prototype.createRequired, next: handlerReturning({}) }),
    ).rejects.toThrow(IdempotencyKeyRequiredError);
    await expect(
      invoke({ handler: ResourcesController.prototype.createRequired, key: 'short', next: handlerReturning({}) }),
    ).rejects.toThrow(IdempotencyKeyInvalidError);
  });

  it('replays the stored response without executing the handler twice', async () => {
    const counter = { calls: 0 };
    const call = { handler: ResourcesController.prototype.createRequired, key: IDEMPOTENCY_KEY, next: handlerReturning({ id: 1 }, counter) };

    await invoke(call);
    const replay = await invoke(call);

    expect(counter.calls).toBe(1);
    expect(replay.body).toEqual({ id: 1 });
    expect(replay.response.statusCode).toBe(201);
    expect(replay.response.headers['Idempotent-Replayed']).toBe('true');
  });

  it('answers 409 while the first request with the same key is still running', async () => {
    const pendingResult = new Subject<unknown>();
    const firstRequest = invoke({
      handler: ResourcesController.prototype.createRequired,
      key: IDEMPOTENCY_KEY,
      next: { handle: (): Observable<unknown> => pendingResult },
    });
    await new Promise((resolve) => setImmediate(resolve));

    await expect(
      invoke({ handler: ResourcesController.prototype.createRequired, key: IDEMPOTENCY_KEY, next: handlerReturning({}) }),
    ).rejects.toThrow(IdempotencyRequestInProgressError);

    pendingResult.next({ id: 1 });
    pendingResult.complete();
    await expect(firstRequest).resolves.toMatchObject({ body: { id: 1 } });
  });

  it('rejects the same key with a different payload', async () => {
    await invoke({ handler: ResourcesController.prototype.createRequired, key: IDEMPOTENCY_KEY, body: { name: 'a' }, next: handlerReturning({}) });

    await expect(
      invoke({ handler: ResourcesController.prototype.createRequired, key: IDEMPOTENCY_KEY, body: { name: 'b' }, next: handlerReturning({}) }),
    ).rejects.toThrow(IdempotencyKeyReusedError);
  });

  it('releases the key when the handler fails so the client can retry', async () => {
    const failing = { handle: () => throwError(() => new Error('boom')) };
    await expect(
      invoke({ handler: ResourcesController.prototype.createRequired, key: IDEMPOTENCY_KEY, next: failing }),
    ).rejects.toThrow('boom');

    const retry = await invoke({ handler: ResourcesController.prototype.createRequired, key: IDEMPOTENCY_KEY, next: handlerReturning({ id: 2 }) });

    expect(retry.body).toEqual({ id: 2 });
  });

  it('still answers the client when the response cannot be stored', async () => {
    const forgetfulStore: IdempotencyStorePort = {
      reserve: (key, fingerprint, lockTtlMs) => store.reserve(key, fingerprint, lockTtlMs),
      complete: () => Promise.reject(new IdempotencyStoreUnavailableError(new Error('redis down'))),
      release: (key) => store.release(key),
    };

    const { body } = await invoke(
      { handler: ResourcesController.prototype.createRequired, key: IDEMPOTENCY_KEY, next: handlerReturning({ id: 1 }) },
      interceptorWith(forgetfulStore),
    );

    expect(body).toEqual({ id: 1 });
  });

  it('fails with 503 semantics when the store cannot reserve the key', async () => {
    const unavailableStore: IdempotencyStorePort = {
      reserve: () => Promise.reject(new IdempotencyStoreUnavailableError(new Error('redis down'))),
      complete: () => Promise.resolve(),
      release: () => Promise.resolve(),
    };

    await expect(
      invoke(
        { handler: ResourcesController.prototype.createRequired, key: IDEMPOTENCY_KEY, next: handlerReturning({}) },
        interceptorWith(unavailableStore),
      ),
    ).rejects.toThrow(IdempotencyStoreUnavailableError);
  });
});
