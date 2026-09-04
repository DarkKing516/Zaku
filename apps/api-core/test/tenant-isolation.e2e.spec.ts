import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/global-exception.filter';
import { ResponseInterceptor } from '../src/common/response.interceptor';

describe('Tenant Isolation (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Tenant A no debe ver datos de Tenant B', async () => {
    const tenantA = '00000000-0000-0000-0000-00000000000a';
    const tenantB = '00000000-0000-0000-0000-00000000000b';

    await request(app.getHttpServer()).post('/api/auth/register').set('x-tenant-id', tenantA).send({
      email: 'owner@a.com',
      password: 'secure123',
    });
    await request(app.getHttpServer()).post('/api/auth/register').set('x-tenant-id', tenantB).send({
      email: 'owner@b.com',
      password: 'secure123',
    });

    const loginA = await request(app.getHttpServer()).post('/api/auth/login').set('x-tenant-id', tenantA).send({
      email: 'owner@a.com',
      password: 'secure123',
    });
    const loginB = await request(app.getHttpServer()).post('/api/auth/login').set('x-tenant-id', tenantB).send({
      email: 'owner@b.com',
      password: 'secure123',
    });

    const tokenA = loginA.body.data.accessToken as string;
    const tokenB = loginB.body.data.accessToken as string;

    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', 'Bearer ' + tokenA)
      .send({ email: 'user@a.com', password: 'secure123' });

    const resourceId = res.body.data.id as string;

    const accessRes = await request(app.getHttpServer())
      .get(`/api/users/${resourceId}`)
      .set('Authorization', 'Bearer ' + tokenB);

    expect(accessRes.status).toBe(403);
    expect(accessRes.body.success).toBe(false);
  });
});
