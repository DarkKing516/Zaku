import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { tenantDatabaseNameFor } from '@zaku/database-lib';
import { OrmEntityRegistry } from '@core/database/orm-entity-registry';
import { provisioningLockKey } from '@modules/tenants/infrastructure/adapters/postgres-tenant-provisioning.lock';
import { INTEGRATION_CONTROL_DATABASE, withDatabase } from '@test/setup/integration-database';
import { createActiveTenant, createTestApp, HttpServer, newIdempotencyKey, registerAndLogin, uniqueSlug } from '@test/support/test-app';

async function pendingSchemaChanges(database: string, entity: DataSource['options']['entities']): Promise<string[]> {
  const dataSource = await new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database,
    entities: entity,
  }).initialize();
  try {
    const sql = await dataSource.driver.createSchemaBuilder().log();
    return sql.upQueries.map((query) => query.query);
  } finally {
    await dataSource.destroy();
  }
}

describe('Tenant lifecycle against PostgreSQL and Redis (integration)', () => {
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a physical database per tenant and registers it in the control plane', async () => {
    const tenantId = await createActiveTenant(server, uniqueSlug('real'));

    const databases = await withDatabase('postgres', (maintenance) =>
      maintenance.query('SELECT datname FROM pg_database WHERE datname = $1', [tenantDatabaseNameFor(tenantId)]),
    );
    const registry = await withDatabase(INTEGRATION_CONTROL_DATABASE, (controlPlane) =>
      controlPlane.query('SELECT status, database_name FROM tenants WHERE id = $1', [tenantId]),
    );

    expect(databases).toHaveLength(1);
    expect(registry).toEqual([{ status: 'ACTIVE', database_name: tenantDatabaseNameFor(tenantId) }]);
  });

  it('provisions more tenants concurrently than the provisioning pool size without deadlocking', async () => {
    const tenantIds = await Promise.all(Array.from({ length: 6 }, () => createActiveTenant(server)));

    expect(new Set(tenantIds).size).toBe(6);
  });

  it('keeps users physically isolated per tenant database', async () => {
    const tenantA = await createActiveTenant(server);
    const tenantB = await createActiveTenant(server);
    const tokenA = await registerAndLogin(server, tenantA, 'owner@a.com');
    const tokenB = await registerAndLogin(server, tenantB, 'owner@a.com');

    const created = await request(server)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'member@a.com', password: 'secure-password' })
      .expect(201);
    await request(server).get(`/api/v1/users/${created.body.data.id}`).set('Authorization', `Bearer ${tokenB}`).expect(404);

    const rowsInB = await withDatabase(tenantDatabaseNameFor(tenantB), (tenantDatabase) =>
      tenantDatabase.query('SELECT email FROM users ORDER BY email'),
    );
    expect(rowsInB).toEqual([{ email: 'owner@a.com' }]);
  });

  it('maps the unique email constraint of the tenant database to a 409', async () => {
    const tenantId = await createActiveTenant(server);
    const token = await registerAndLogin(server, tenantId, 'dup@example.com');

    const response = await request(server)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'dup@example.com', password: 'secure-password' })
      .expect(409);

    expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
  });

  it('replays idempotent responses stored in Redis', async () => {
    const idempotencyKey = newIdempotencyKey();
    const payload = { slug: uniqueSlug('redis'), name: 'Redis Corp' };

    const first = await request(server).post('/api/v1/tenants').set('Idempotency-Key', idempotencyKey).send(payload).expect(201);
    const retry = await request(server).post('/api/v1/tenants').set('Idempotency-Key', idempotencyKey).send(payload).expect(201);

    expect(retry.headers['idempotent-replayed']).toBe('true');
    expect(retry.body.data.id).toBe(first.body.data.id);
  });

  it('rejects a provisioning retry while another session holds the tenant provisioning lock', async () => {
    const tenantId = await createActiveTenant(server);

    await withDatabase(INTEGRATION_CONTROL_DATABASE, async (controlPlane) => {
      const lockHolder = controlPlane.createQueryRunner();
      await lockHolder.connect();
      try {
        await lockHolder.query('SELECT pg_advisory_lock(hashtext($1))', [provisioningLockKey(tenantId)]);
        const blocked = await request(server).post(`/api/v1/tenants/${tenantId}/provisioning`).expect(409);
        expect(blocked.body.error.code).toBe('TENANT_PROVISIONING_IN_PROGRESS');
      } finally {
        await lockHolder.query('SELECT pg_advisory_unlock_all()');
        await lockHolder.release();
      }
    });

    const afterRelease = await request(server).post(`/api/v1/tenants/${tenantId}/provisioning`).expect(409);
    expect(afterRelease.body.error.code).toBe('TENANT_NOT_PROVISIONABLE');
  });

  it('has every registered ORM entity matching the migrations exactly (no schema drift)', async () => {
    const tenantId = await createActiveTenant(server);
    const controlPlaneEntities = OrmEntityRegistry.controlPlaneEntities();
    const tenantEntities = OrmEntityRegistry.tenantEntities();

    expect(controlPlaneEntities.length).toBeGreaterThan(0);
    expect(tenantEntities.length).toBeGreaterThan(0);
    await expect(pendingSchemaChanges(INTEGRATION_CONTROL_DATABASE, controlPlaneEntities)).resolves.toEqual([]);
    await expect(pendingSchemaChanges(tenantDatabaseNameFor(tenantId), tenantEntities)).resolves.toEqual([]);
  });
});
