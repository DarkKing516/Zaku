import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiEnvelope } from '../http/decorators/api-envelope.decorator';
import { Public } from '../security/public.decorator';
import { TenantAgnostic } from '../tenancy/tenant-agnostic.decorator';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';
}

@ApiTags('health')
@Public()
@TenantAgnostic()
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  @ApiEnvelope(HealthResponseDto)
  check(): HealthResponseDto {
    return { status: 'ok' };
  }
}
