import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { HttpPipelineModule } from './http/http-pipeline.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { MockingModule } from './mocking/mocking.module';
import { RequestContextModule } from './request-context/request-context.module';
import { JwtAuthGuard } from './security/jwt-auth.guard';
import { SecurityModule } from './security/security.module';
import { TenantAccessGuard } from './tenancy/tenant-access.guard';

@Module({
  imports: [
    AppConfigModule,
    CqrsModule.forRoot(),
    RequestContextModule,
    SecurityModule,
    HttpPipelineModule,
    MockingModule,
    DatabaseModule,
    IdempotencyModule,
    HealthModule,
  ],
  providers: [
    // Order matters: TenantAccessGuard reads the principal that JwtAuthGuard binds.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantAccessGuard },
  ],
})
export class CoreModule {}
