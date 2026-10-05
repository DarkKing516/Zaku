import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createActiveTenant, createTestApp, HttpServer, registerAndLogin, registerUser } from '@test/support/test-app';

describe('Tenant isolation (e2e)', () => {
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  async function twoTenantsWithOwners() {
    const tenantA = await createActiveTenant(server);
    const tenantB = await createActiveTenant(server);
    return {
      tenantA,
      tenantB,
      tokenA: await registerAndLogin(server, tenantA, 'owner@a.com'),
      tokenB: await registerAndLogin(server, tenantB, 'owner@b.com'),
    };
  }

  it('does not let tenant B read a user created in tenant A', async () => {
    const { tokenA, tokenB } = await twoTenantsWithOwners();
    const created = await request(server)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'user@a.com', password: 'secure-password' })
      .expect(201);

    const crossTenantRead = await request(server)
      .get(`/api/v1/users/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    expect(crossTenantRead.body).toMatchObject({ success: false, error: { code: 'USER_NOT_FOUND' } });
  });

  it('lists only the users of the token tenant', async () => {
    const { tokenB } = await twoTenantsWithOwners();

    const listB = await request(server).get('/api/v1/users').set('Authorization', `Bearer ${tokenB}`).expect(200);

    expect(listB.body.data.map((user: { email: string }) => user.email)).toEqual(['owner@b.com']);
  });

  it('rejects a tenant header that does not match the token tenant', async () => {
    const { tokenA, tenantB } = await twoTenantsWithOwners();

    const response = await request(server)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-tenant-id', tenantB)
      .expect(403);

    expect(response.body.error.code).toBe('TENANT_MISMATCH');
  });

  it('allows the same email in different tenants because each tenant owns its users', async () => {
    const { tenantB } = await twoTenantsWithOwners();

    await registerUser(server, tenantB, 'owner@a.com');
  });
});
