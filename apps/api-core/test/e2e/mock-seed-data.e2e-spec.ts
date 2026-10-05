import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DEMO_TENANT, DEMO_USER } from '@core/mocking/demo-fixtures';
import { createTestApp, HttpServer } from '@test/support/test-app';
import { overrideEnvironment } from '@test/support/environment-overrides';

describe('Mock seed data (e2e)', () => {
  let app: INestApplication;
  let server: HttpServer;
  let restoreEnvironment: () => void;

  beforeAll(async () => {
    restoreEnvironment = overrideEnvironment({ MOCK_SEED_DATA: 'true' });
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    restoreEnvironment();
  });

  it('lets a frontend developer log in as the demo user without any database', async () => {
    const login = await request(server)
      .post('/api/v1/user-auth/login')
      .set('x-tenant-id', DEMO_TENANT.id)
      .send({ email: DEMO_USER.email, password: DEMO_USER.password })
      .expect(200);

    const users = await request(server)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    expect(users.body.data).toEqual([expect.objectContaining({ email: DEMO_USER.email, tenantId: DEMO_TENANT.id })]);
  });
});
