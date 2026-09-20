import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyCleanup(): Promise<void> {
    this.logger.log('Daily cleanup placeholder executed');
  }
}
