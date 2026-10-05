import { ApiProperty } from '@nestjs/swagger';
import type { UserResponse } from '@zaku/shared-types';
import { UserView } from '../../../application/views/user.view';

export class UserResponseDto implements UserResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromView(view: UserView): UserResponseDto {
    return Object.assign(new UserResponseDto(), {
      id: view.id,
      tenantId: view.tenantId,
      email: view.email,
      createdAt: view.createdAt.toISOString(),
      updatedAt: view.updatedAt.toISOString(),
    });
  }
}
