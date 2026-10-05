import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import {
  createActiveTenant,
  createTestApp,
  HttpServer,
  mockTenantProvisioner,
  newIdempotencyKey,
  registerAndLogin,
  uniqueSlug,
} from '@test/support/test-app';

describe('Idempotency (e2e)', () => {
  let app: NestExpressApplication;
  let server: HttpServer;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires the Idempotency-Key header where the route demands it', async () => {
    const response = await request(server).post('/api/v1/tenants').send({ slug: uniqueSlug(), name: 'No Key' }).expect(400);

    expect(response.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('rejects a malformed key', async () => {
    const response = await request(server)
      .post('/api/v1/tenants')
      .set('Idempotency-Key', 'short')
      .send({ slug: uniqueSlug(), name: 'Bad Key' })
      .expect(400);

    expect(response.body.error.code).toBe('IDEMPOTENCY_KEY_INVALID');
  });

  it('replays the first response for a retried request instead of executing it twice', async () => {
    const idempotencyKey = newIdempotencyKey();
    const payload = { slug: uniqueSlug('replay'), name: 'Replay Corp' };

    const first = await request(server).post('/api/v1/tenants').set('Idempotency-Key', idempotencyKey).send(payload).expect(201);
    const retry = await request(server).post('/api/v1/tenants').set('Idempotency-Key', idempotencyKey).send(payload).expect(201);

    expect(retry.headers['idempotent-replayed']).toBe('true');
    expect(first.headers['idempotent-replayed']).toBeUndefined();
    expect(retry.body.data).toEqual(first.body.data);
    expect(retry.body.meta.requestId).not.toBe(first.body.meta.requestId);
  });

  it('rejects reusing a key with a different payload', async () => {
    const idempotencyKey = newIdempotencyKey();
    await request(server)
      .post('/api/v1/tenants')
      .set('Idempotency-Key', idempotencyKey)
      .send({ slug: uniqueSlug(), name: 'Original' })
      .expect(201);

    const response = await request(server)
      .post('/api/v1/tenants')
      .set('Idempotency-Key', idempotencyKey)
      .send({ slug: uniqueSlug(), name: 'Different' })
      .expect(422);

    expect(response.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('does not store a failed attempt, so retrying with the same key executes again and succeeds', async () => {
    const idempotencyKey = newIdempotencyKey();
    const payload = { slug: uniqueSlug('second-try'), name: 'Second Try' };
    mockTenantProvisioner(app).failNextProvisioning();

    await request(server).post('/api/v1/tenants').set('Idempotency-Key', idempotencyKey).send(payload).expect(503);
    const retry = await request(server).post('/api/v1/tenants').set('Idempotency-Key', idempotencyKey).send(payload).expect(201);

    expect(retry.headers['idempotent-replayed']).toBeUndefined();
    expect(retry.body.data.status).toBe('ACTIVE');
  });

  it('scopes keys per tenant and user on tenant routes', async () => {
    const tenantA = await createActiveTenant(server);
    const tenantB = await createActiveTenant(server);
    const tokenA = await registerAndLogin(server, tenantA);
    const tokenB = await registerAndLogin(server, tenantB);
    const sharedKey = newIdempotencyKey();
    const payload = { email: 'same@example.com', password: 'secure-password' };

    const inA = await request(server)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', sharedKey)
      .send(payload)
      .expect(201);
    const inB = await request(server)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('Idempotency-Key', sharedKey)
      .send(payload)
      .expect(201);

    expect(inB.headers['idempotent-replayed']).toBeUndefined();
    expect(inB.body.data.tenantId).toBe(tenantB);
    expect(inB.body.data.id).not.toBe(inA.body.data.id);
  });
});
