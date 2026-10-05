import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SCALAR_STUB_MARKER } from '@test/support/scalar-api-reference.stub';
import { createTestApp, HttpServer } from '@test/support/test-app';

describe('HTTP contract (e2e)', () => {
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the unversioned public health check inside the envelope', async () => {
    const response = await request(server).get('/health').expect(200);

    expect(response.body).toEqual({
      success: true,
      statusCode: 200,
      message: 'OK',
      data: { status: 'ok' },
      meta: { requestId: expect.any(String), timestamp: expect.any(String) },
    });
    expect(response.headers['x-request-id']).toBe(response.body.meta.requestId);
  });

  it('propagates a safe client request id', async () => {
    const response = await request(server).get('/health').set('x-request-id', 'trace-123').expect(200);

    expect(response.body.meta.requestId).toBe('trace-123');
  });

  it('wraps unknown routes in the error envelope', async () => {
    const response = await request(server).get('/api/v1/does-not-exist').set('Authorization', 'Bearer x').expect(404);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 404,
      data: null,
      error: { code: 'NOT_FOUND', details: [] },
      errorImage: 'https://http.cat/404',
      meta: { path: '/api/v1/does-not-exist' },
    });
  });

  it('denies protected routes without a token', async () => {
    const response = await request(server).get('/api/v1/users').expect(401);

    expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
  });

  it('answers malformed JSON with a 400 envelope', async () => {
    const response = await request(server)
      .post('/api/v1/tenants')
      .set('Content-Type', 'application/json')
      .set('Idempotency-Key', 'malformed-json-key')
      .send('{"slug":')
      .expect(400);

    expect(response.body).toMatchObject({ success: false, statusCode: 400 });
  });

  it('answers oversized bodies with a 413 envelope instead of a 500', async () => {
    const response = await request(server)
      .post('/api/v1/tenants')
      .set('Idempotency-Key', 'oversized-body-key')
      .send({ slug: 'huge', name: 'x'.repeat(200_000) })
      .expect(413);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 413,
      error: { code: 'PAYLOAD_TOO_LARGE' },
      meta: { requestId: expect.any(String) },
    });
  });

  it('publishes the OpenAPI document', async () => {
    const response = await request(server).get('/api/documentation/swagger-json').expect(200);

    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/api/v1/tenants',
        '/api/v1/tenants/{tenantId}/provisioning',
        '/api/v1/users',
        '/api/v1/user-auth/login',
        '/api/v1/user-auth/register',
      ]),
    );
  });

  it('mounts the Scalar API reference next to Swagger UI and feeds it the OpenAPI document', async () => {
    const response = await request(server).get('/api/documentation/scalar').expect(200);

    expect(response.text).toContain(`${SCALAR_STUB_MARKER}: Zaku API`);
  });
});
