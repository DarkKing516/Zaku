import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { RequestContextMiddleware } from './tenant/request-context.middleware';
import { UsersModule } from './users/users.module';
import { RequestIdMiddleware } from './request-id/request-id.middleware';
import { JobsModule } from './jobs/jobs.module';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, UsersModule, JobsModule],
  controllers: [HealthController],
  providers: [MaintenanceService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, RequestContextMiddleware).forRoutes('*');
  }
}
