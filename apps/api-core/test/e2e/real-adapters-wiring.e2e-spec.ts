import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { IDEMPOTENCY_STORE } from '@core/idempotency/idempotency-store.port';
import { RedisIdempotencyStore } from '@core/idempotency/redis-idempotency.store';
import { TENANT_DATABASE_PROVISIONER } from '@modules/tenants/application/ports/tenant-database-provisioner.port';
import { TENANT_PROVISIONING_LOCK } from '@modules/tenants/application/ports/tenant-provisioning-lock.port';
import { TENANT_REPOSITORY } from '@modules/tenants/application/ports/tenant.repository.port';
import { PostgresTenantDatabaseProvisioner } from '@modules/tenants/infrastructure/adapters/postgres-tenant-database.provisioner';
import { PostgresTenantProvisioningLock } from '@modules/tenants/infrastructure/adapters/postgres-tenant-provisioning.lock';
import { TypeOrmTenantRepository } from '@modules/tenants/infrastructure/persistence/typeorm/typeorm-tenant.repository';
import { USER_REPOSITORY } from '@modules/users/application/ports/user.repository.port';
import { TypeOrmUserRepository } from '@modules/users/infrastructure/persistence/typeorm/typeorm-user.repository';
import { overrideEnvironment } from '@test/support/environment-overrides';
import { createTestApp, HttpServer } from '@test/support/test-app';

describe('Real adapter wiring without infrastructure (e2e)', () => {
  let app: INestApplication;
  let server: HttpServer;
  let restoreEnvironment: () => void;

  beforeAll(async () => {
    restoreEnvironment = overrideEnvironment({ MOCK_ADAPTERS: '' });
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    restoreEnvironment();
  });

  it('resolves every real adapter and its dependencies without opening connections at boot', () => {
    expect(app.get(TENANT_REPOSITORY)).toBeInstanceOf(TypeOrmTenantRepository);
    expect(app.get(TENANT_DATABASE_PROVISIONER)).toBeInstanceOf(PostgresTenantDatabaseProvisioner);
    expect(app.get(TENANT_PROVISIONING_LOCK)).toBeInstanceOf(PostgresTenantProvisioningLock);
    expect(app.get(USER_REPOSITORY)).toBeInstanceOf(TypeOrmUserRepository);
    expect(app.get(IDEMPOTENCY_STORE)).toBeInstanceOf(RedisIdempotencyStore);
  });

  it('serves routes that do not need the database', async () => {
    await request(server).get('/health').expect(200);
  });

  it('answers 503 DATABASE_UNAVAILABLE when PostgreSQL cannot be reached', async () => {
    const response = await request(server).get('/api/v1/tenants').expect(503);

    expect(response.body.error.code).toBe('DATABASE_UNAVAILABLE');
    expect(response.body.message).not.toContain('zaku');
  });
});
