import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { configureHttpApp } from '@core/http/configure-http-app';
import { TENANT_DATABASE_PROVISIONER } from '@modules/tenants/application/ports/tenant-database-provisioner.port';
import { InMemoryTenantDatabaseProvisioner } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-database.provisioner';
import { AppModule } from '../../src/app.module';

export type HttpServer = Parameters<typeof request>[0];

export const DEFAULT_PASSWORD = 'secure-password';

export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureHttpApp(app);
  await app.init();
  return app;
}

export function mockTenantProvisioner(app: NestExpressApplication): InMemoryTenantDatabaseProvisioner {
  const provisioner: unknown = app.get(TENANT_DATABASE_PROVISIONER);
  if (!(provisioner instanceof InMemoryTenantDatabaseProvisioner)) {
    throw new Error('This test expects the mock tenant database provisioner');
  }
  return provisioner;
}

export function uniqueSlug(prefix = 'tenant'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@example.com`;
}

export function newIdempotencyKey(): string {
  return randomUUID();
}

export async function createActiveTenant(server: HttpServer, slug = uniqueSlug()): Promise<string> {
  const response = await request(server)
    .post('/api/v1/tenants')
    .set('Idempotency-Key', newIdempotencyKey())
    .send({ slug, name: `Tenant ${slug}` })
    .expect(201);
  return response.body.data.id as string;
}

export async function registerUser(
  server: HttpServer,
  tenantId: string,
  email = uniqueEmail(),
  password = DEFAULT_PASSWORD,
): Promise<string> {
  const response = await request(server)
    .post('/api/v1/user-auth/register')
    .set('x-tenant-id', tenantId)
    .send({ email, password })
    .expect(201);
  return response.body.data.id as string;
}

export async function login(server: HttpServer, tenantId: string, email: string, password = DEFAULT_PASSWORD): Promise<string> {
  const response = await request(server)
    .post('/api/v1/user-auth/login')
    .set('x-tenant-id', tenantId)
    .send({ email, password })
    .expect(200);
  return response.body.data.accessToken as string;
}

export async function registerAndLogin(server: HttpServer, tenantId: string, email = uniqueEmail()): Promise<string> {
  await registerUser(server, tenantId, email);
  return login(server, tenantId, email);
}
