import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  DEFAULT_PASSWORD,
  createActiveTenant,
  createTestApp,
  HttpServer,
  newIdempotencyKey,
  registerUser,
  uniqueEmail,
} from '@test/support/test-app';

describe('User auth (e2e)', () => {
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user and returns it inside the standard envelope', async () => {
    const tenantId = await createActiveTenant(server);

    const response = await request(server)
      .post('/api/v1/user-auth/register')
      .set('x-tenant-id', tenantId)
      .send({ email: 'New.User@Example.com', password: DEFAULT_PASSWORD })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      message: 'User registered',
      data: { tenantId, email: 'new.user@example.com' },
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });

  it('replays a registration retried with the same Idempotency-Key', async () => {
    const tenantId = await createActiveTenant(server);
    const idempotencyKey = newIdempotencyKey();
    const register = () =>
      request(server)
        .post('/api/v1/user-auth/register')
        .set('x-tenant-id', tenantId)
        .set('Idempotency-Key', idempotencyKey)
        .send({ email: 'retry@example.com', password: DEFAULT_PASSWORD });

    const first = await register().expect(201);
    const retry = await register().expect(201);

    expect(retry.headers['idempotent-replayed']).toBe('true');
    expect(retry.body.data.id).toBe(first.body.data.id);
  });

  it('rejects a duplicated email in the same tenant', async () => {
    const tenantId = await createActiveTenant(server);
    const email = uniqueEmail();
    await registerUser(server, tenantId, email);

    const response = await request(server)
      .post('/api/v1/user-auth/register')
      .set('x-tenant-id', tenantId)
      .send({ email, password: DEFAULT_PASSWORD })
      .expect(409);

    expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
  });

  it('logs in and the issued token authorizes tenant routes', async () => {
    const tenantId = await createActiveTenant(server);
    const email = uniqueEmail();
    const userId = await registerUser(server, tenantId, email);

    const response = await request(server)
      .post('/api/v1/user-auth/login')
      .set('x-tenant-id', tenantId)
      .send({ email, password: DEFAULT_PASSWORD })
      .expect(200);

    expect(response.body.data).toMatchObject({
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: userId, tenantId, email },
    });
    await request(server).get('/api/v1/users').set('Authorization', `Bearer ${response.body.data.accessToken}`).expect(200);
  });

  it('answers wrong passwords and unknown emails identically', async () => {
    const tenantId = await createActiveTenant(server);
    const email = uniqueEmail();
    await registerUser(server, tenantId, email);
    const attempt = (attemptEmail: string, password: string) =>
      request(server).post('/api/v1/user-auth/login').set('x-tenant-id', tenantId).send({ email: attemptEmail, password });

    const wrongPassword = await attempt(email, 'wrong-password').expect(401);
    const unknownEmail = await attempt(uniqueEmail(), DEFAULT_PASSWORD).expect(401);

    expect(wrongPassword.body.error).toEqual(unknownEmail.body.error);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    expect(wrongPassword.body.error.code).toBe('USER_AUTH_INVALID_CREDENTIALS');
  });

  it('does not apply the registration password policy to login attempts', async () => {
    const tenantId = await createActiveTenant(server);

    const response = await request(server)
      .post('/api/v1/user-auth/login')
      .set('x-tenant-id', tenantId)
      .send({ email: 'legacy-account', password: 'short' })
      .expect(401);

    expect(response.body.error.code).toBe('USER_AUTH_INVALID_CREDENTIALS');
  });

  it('requires a well formed tenant header on public tenant routes', async () => {
    const missing = await request(server)
      .post('/api/v1/user-auth/login')
      .send({ email: uniqueEmail(), password: DEFAULT_PASSWORD })
      .expect(400);
    const malformed = await request(server)
      .post('/api/v1/user-auth/login')
      .set('x-tenant-id', 'not-a-uuid')
      .send({ email: uniqueEmail(), password: DEFAULT_PASSWORD })
      .expect(400);

    expect(missing.body.error.code).toBe('TENANT_HEADER_REQUIRED');
    expect(malformed.body.error.code).toBe('TENANT_HEADER_INVALID');
  });

  it('rejects an unknown tenant without revealing whether it exists', async () => {
    const response = await request(server)
      .post('/api/v1/user-auth/login')
      .set('x-tenant-id', '00000000-0000-4000-8000-0000000000ff')
      .send({ email: uniqueEmail(), password: DEFAULT_PASSWORD })
      .expect(403);

    expect(response.body.error.code).toBe('TENANT_UNAVAILABLE');
  });

  it('rejects requests with an invalid bearer token', async () => {
    const response = await request(server).get('/api/v1/users').set('Authorization', 'Bearer not-a-jwt').expect(401);

    expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });
});
