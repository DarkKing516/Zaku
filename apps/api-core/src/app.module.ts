import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { HealthController } from './core/health/health.controller';
import { RequestContextMiddleware } from './modules/tenant/middlewares/request-context.middleware';
import { UsersModule } from './modules/users/users.module';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import { JobsModule } from './core/jobs/jobs.module';
import { MaintenanceService } from './core/maintenance/maintenance.service';

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
