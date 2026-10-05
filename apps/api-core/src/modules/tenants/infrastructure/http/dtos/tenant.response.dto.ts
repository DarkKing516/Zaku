import { ApiProperty } from '@nestjs/swagger';
import type { TenantResponse } from '@zaku/shared-types';
import { TenantView } from '../../../application/views/tenant.view';
import { TenantStatus } from '../../../domain/tenant-status';

export class TenantResponseDto implements TenantResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'acme' })
  slug!: string;

  @ApiProperty({ example: 'Acme Corporation' })
  name!: string;

  @ApiProperty({ enum: Object.values(TenantStatus), example: TenantStatus.Active })
  status!: TenantStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromView(view: TenantView): TenantResponseDto {
    return Object.assign(new TenantResponseDto(), {
      id: view.id,
      slug: view.slug,
      name: view.name,
      status: view.status,
      createdAt: view.createdAt.toISOString(),
      updatedAt: view.updatedAt.toISOString(),
    });
  }
}
