import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import {
  DEFAULT_PASSWORD,
  createActiveTenant,
  createTestApp,
  HttpServer,
  mockTenantProvisioner,
  newIdempotencyKey,
  uniqueEmail,
  uniqueSlug,
} from '@test/support/test-app';

describe('Tenants (e2e)', () => {
  let app: NestExpressApplication;
  let server: HttpServer;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  function createTenant(slug: string, name = 'Acme Corp', idempotencyKey = newIdempotencyKey()) {
    return request(server).post('/api/v1/tenants').set('Idempotency-Key', idempotencyKey).send({ slug, name });
  }

  it('creates an active tenant and provisions its database', async () => {
    const slug = uniqueSlug('acme');

    const response = await createTenant(slug).expect(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      message: 'Tenant created',
      data: { slug, name: 'Acme Corp', status: 'ACTIVE' },
    });
    expect(response.body.data).not.toHaveProperty('databaseName');
    expect(mockTenantProvisioner(app).isProvisioned(response.body.data.id)).toBe(true);
  });

  it('rejects a slug that belongs to an active tenant', async () => {
    const slug = uniqueSlug();
    await createTenant(slug).expect(201);

    const response = await createTenant(slug, 'Twice').expect(409);

    expect(response.body.error.code).toBe('TENANT_SLUG_TAKEN');
  });

  it('returns validation details for an invalid payload', async () => {
    const response = await request(server)
      .post('/api/v1/tenants')
      .set('Idempotency-Key', newIdempotencyKey())
      .send({ slug: 'Not Valid!', name: 'x', unexpected: true })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    const invalidFields = response.body.error.details.map((detail: { field: string }) => detail.field);
    expect(invalidFields).toEqual(expect.arrayContaining(['slug', 'name', 'unexpected']));
  });

  it('lists tenants with pagination metadata', async () => {
    await createActiveTenant(server);
    await createActiveTenant(server);

    const response = await request(server).get('/api/v1/tenants?page=1&pageSize=1').expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.pagination).toMatchObject({ page: 1, pageSize: 1 });
    expect(response.body.meta.pagination.totalItems).toBeGreaterThanOrEqual(2);
  });

  it.each([
    ['page=0', 'page'],
    ['pageSize=101', 'pageSize'],
    ['page=1.5', 'page'],
    ['page=abc', 'page'],
    ['unknown=1', 'unknown'],
  ])('rejects invalid pagination query %s', async (query, field) => {
    const response = await request(server).get(`/api/v1/tenants?${query}`).expect(400);

    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
  });

  it('returns 404 for an unknown tenant and 400 for a malformed id', async () => {
    const missing = await request(server).get('/api/v1/tenants/00000000-0000-4000-8000-0000000000ff').expect(404);
    const malformed = await request(server).get('/api/v1/tenants/not-a-uuid').expect(400);

    expect(missing.body.error.code).toBe('TENANT_NOT_FOUND');
    expect(malformed.body.error).toMatchObject({ code: 'VALIDATION_FAILED', details: [{ field: 'tenantId' }] });
  });

  it('accepts ids in any letter case, like PostgreSQL does', async () => {
    const tenantId = await createActiveTenant(server);

    const response = await request(server).get(`/api/v1/tenants/${tenantId.toUpperCase()}`).expect(200);

    expect(response.body.data.id).toBe(tenantId);
  });

  it('keeps a failed tenant and resumes it when the client repeats the creation', async () => {
    const slug = uniqueSlug('flaky');
    mockTenantProvisioner(app).failNextProvisioning();

    const failed = await createTenant(slug, 'Flaky Corp').expect(503);
    expect(failed.body.error.code).toBe('TENANT_PROVISIONING_FAILED');

    const resumed = await createTenant(slug, 'Flaky Corp').expect(201);
    expect(resumed.body.data).toMatchObject({ slug, status: 'ACTIVE' });

    const list = await request(server).get('/api/v1/tenants?pageSize=100').expect(200);
    expect(list.body.data.filter((tenant: { slug: string }) => tenant.slug === slug)).toHaveLength(1);
  });

  it('lets a client retry the provisioning of a failed tenant explicitly', async () => {
    const slug = uniqueSlug('retry');
    mockTenantProvisioner(app).failNextProvisioning();
    const failed = await createTenant(slug).expect(503);
    const failedTenantId = failed.body.error.details.find((detail: { field: string }) => detail.field === 'tenantId')
      .message as string;
    const stored = await request(server).get(`/api/v1/tenants/${failedTenantId}`).expect(200);
    expect(stored.body.data).toMatchObject({ slug, status: 'FAILED' });

    const retried = await request(server).post(`/api/v1/tenants/${failedTenantId}/provisioning`).expect(200);
    const again = await request(server).post(`/api/v1/tenants/${failedTenantId}/provisioning`).expect(409);

    expect(retried.body.data.status).toBe('ACTIVE');
    expect(again.body.error.code).toBe('TENANT_NOT_PROVISIONABLE');
  });

  it('does not let users of a FAILED tenant log in', async () => {
    const slug = uniqueSlug('broken');
    mockTenantProvisioner(app).failNextProvisioning();
    await createTenant(slug).expect(503);
    const list = await request(server).get('/api/v1/tenants?pageSize=100').expect(200);
    const brokenTenantId = list.body.data.find((tenant: { slug: string }) => tenant.slug === slug).id as string;

    const response = await request(server)
      .post('/api/v1/user-auth/login')
      .set('x-tenant-id', brokenTenantId)
      .send({ email: uniqueEmail(), password: DEFAULT_PASSWORD })
      .expect(403);

    expect(response.body.error.code).toBe('TENANT_UNAVAILABLE');
  });
});
