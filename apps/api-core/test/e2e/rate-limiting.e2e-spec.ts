import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { overrideEnvironment } from '@test/support/environment-overrides';
import { DEFAULT_PASSWORD, createActiveTenant, createTestApp, HttpServer, uniqueEmail } from '@test/support/test-app';

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;
  let server: HttpServer;
  let restoreEnvironment: () => void;

  beforeAll(async () => {
    restoreEnvironment = overrideEnvironment({ RATE_LIMIT_CREDENTIALS_MAX_REQUESTS: '3' });
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    restoreEnvironment();
  });

  function attemptLogin(tenantId: string, email: string) {
    return request(server).post('/api/v1/user-auth/login').set('x-tenant-id', tenantId).send({ email, password: 'wrong-password' });
  }

  it('throttles repeated credential attempts against one account with a 429 envelope', async () => {
    const tenantId = await createActiveTenant(server);
    const targetedEmail = uniqueEmail();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await attemptLogin(tenantId, targetedEmail).expect(401);
    }
    const throttled = await attemptLogin(tenantId, targetedEmail).expect(429);

    expect(throttled.body).toMatchObject({ success: false, statusCode: 429, error: { code: 'TOO_MANY_REQUESTS' } });
  });

  it('keeps other accounts usable from the same client, so a shared proxy IP is not locked out', async () => {
    const tenantId = await createActiveTenant(server);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await attemptLogin(tenantId, 'victim@example.com').expect(401);
    }

    await attemptLogin(tenantId, uniqueEmail()).expect(401);
    await request(server)
      .post('/api/v1/user-auth/register')
      .set('x-tenant-id', tenantId)
      .send({ email: uniqueEmail(), password: DEFAULT_PASSWORD })
      .expect(201);
  });

  it('does not apply the credentials limit to other routes', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(server).get('/api/v1/tenants').expect(200);
    }
  });
});
