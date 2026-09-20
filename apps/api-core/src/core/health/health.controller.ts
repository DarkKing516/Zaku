import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: string; checks: { api: string } } {
    return { status: 'ok', checks: { api: 'up' } };
  }
}
