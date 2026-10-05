import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import type { CreateUserRequest } from '@zaku/shared-types';

export class CreateUserRequestDto implements CreateUserRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'securePassword123', minLength: 8, maxLength: 72 })
  @IsString()
  @Length(8, 72)
  password!: string;
}
