import { Page } from '@common/pagination/page';
import { buildErrorEnvelope, buildSuccessEnvelope } from '@core/http/response-envelope';

describe('response envelope builders', () => {
  it('wraps plain data with a default message for the status', () => {
    const envelope = buildSuccessEnvelope({ result: { id: 1 }, statusCode: 201, requestId: 'req-1' });

    expect(envelope).toEqual({
      success: true,
      statusCode: 201,
      message: 'Created',
      data: { id: 1 },
      meta: { requestId: 'req-1', timestamp: expect.any(String) },
    });
  });

  it('uses null data for handlers that return nothing', () => {
    expect(buildSuccessEnvelope({ result: undefined, statusCode: 200, requestId: 'req-1' }).data).toBeNull();
  });

  it('moves pagination into meta and keeps data as a plain array', () => {
    const envelope = buildSuccessEnvelope({
      result: new Page(['a', 'b'], 2, 2, 5),
      statusCode: 200,
      message: 'Listed',
      requestId: 'req-1',
    });

    expect(envelope.message).toBe('Listed');
    expect(envelope.data).toEqual(['a', 'b']);
    expect(envelope.meta.pagination).toEqual({ page: 2, pageSize: 2, totalItems: 5, totalPages: 3 });
  });

  it('builds the error envelope with the http.cat image and request path', () => {
    const envelope = buildErrorEnvelope({
      statusCode: 409,
      code: 'TENANT_SLUG_TAKEN',
      message: 'Taken',
      details: [],
      requestId: 'req-1',
      path: '/api/v1/tenants',
    });

    expect(envelope).toMatchObject({
      success: false,
      data: null,
      error: { code: 'TENANT_SLUG_TAKEN', details: [] },
      errorImage: 'https://http.cat/409',
      meta: { requestId: 'req-1', path: '/api/v1/tenants' },
    });
  });
});
