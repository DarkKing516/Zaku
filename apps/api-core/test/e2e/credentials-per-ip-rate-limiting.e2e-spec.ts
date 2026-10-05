import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { overrideEnvironment } from '@test/support/environment-overrides';
import { createActiveTenant, createTestApp, HttpServer, uniqueEmail } from '@test/support/test-app';

describe('Credentials rate limiting per client IP (e2e)', () => {
  let app: INestApplication;
  let server: HttpServer;
  let restoreEnvironment: () => void;

  beforeAll(async () => {
    restoreEnvironment = overrideEnvironment({
      RATE_LIMIT_CREDENTIALS_MAX_REQUESTS: '100',
      RATE_LIMIT_CREDENTIALS_PER_IP_MAX_REQUESTS: '4',
    });
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    restoreEnvironment();
  });

  it('stops one client from spraying passwords across many accounts', async () => {
    const tenantId = await createActiveTenant(server);
    const attemptLogin = () =>
      request(server)
        .post('/api/v1/user-auth/login')
        .set('x-tenant-id', tenantId)
        .send({ email: uniqueEmail(), password: 'guessed-password' });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await attemptLogin().expect(401);
    }
    const throttled = await attemptLogin().expect(429);

    expect(throttled.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
