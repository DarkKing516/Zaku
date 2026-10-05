import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import type { CreateTenantRequest } from '@zaku/shared-types';
import {
  TENANT_SLUG_MAX_LENGTH,
  TENANT_SLUG_MIN_LENGTH,
  TENANT_SLUG_PATTERN,
} from '../../../domain/value-objects/tenant-slug';

export class CreateTenantRequestDto implements CreateTenantRequest {
  @ApiProperty({ example: 'acme', description: 'Immutable identifier: lowercase letters, digits and single dashes' })
  @IsString()
  @Length(TENANT_SLUG_MIN_LENGTH, TENANT_SLUG_MAX_LENGTH)
  @Matches(TENANT_SLUG_PATTERN, { message: 'slug must contain lowercase letters, digits and single dashes' })
  slug!: string;

  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @Length(2, 100)
  name!: string;
}
