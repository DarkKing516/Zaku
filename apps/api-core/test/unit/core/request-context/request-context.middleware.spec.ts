import { RequestContext } from '@core/request-context/request-context';
import {
  REQUEST_ID_HEADER,
  RequestContextMiddleware,
  resolveRequestId,
} from '@core/request-context/request-context.middleware';
import { fakeRequest, fakeResponse } from '@test/support/http-execution-context';

describe('resolveRequestId', () => {
  it('keeps a safe client supplied id', () => {
    expect(resolveRequestId('client-id_1.2')).toBe('client-id_1.2');
  });

  it.each([undefined, '', 'has spaces', 'x'.repeat(129), '<script>'])('generates a new id for %p', (clientId) => {
    expect(resolveRequestId(clientId)).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('RequestContextMiddleware', () => {
  it('echoes the request id and runs the rest of the pipeline inside its request context', () => {
    const response = fakeResponse();
    let requestIdSeenDownstream: string | undefined;

    new RequestContextMiddleware().use(fakeRequest({ headers: { [REQUEST_ID_HEADER]: 'client-id-1' } }), response, () => {
      requestIdSeenDownstream = RequestContext.current()?.requestId;
    });

    expect(response.headers[REQUEST_ID_HEADER]).toBe('client-id-1');
    expect(requestIdSeenDownstream).toBe('client-id-1');
    expect(RequestContext.current()).toBeUndefined();
  });
});
