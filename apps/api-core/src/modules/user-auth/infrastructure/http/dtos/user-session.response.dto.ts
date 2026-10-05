import { ApiProperty } from '@nestjs/swagger';
import type { LoginResponse } from '@zaku/shared-types';
import { UserResponseDto } from '@modules/users';
import { UserSessionView } from '../../../application/views/user-session.view';

export class UserSessionResponseDto implements LoginResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: 3600, description: 'Seconds until the access token expires' })
  expiresIn!: number;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  static fromView(view: UserSessionView): UserSessionResponseDto {
    return Object.assign(new UserSessionResponseDto(), {
      accessToken: view.accessToken,
      tokenType: view.tokenType,
      expiresIn: view.expiresInSeconds,
      user: UserResponseDto.fromView(view.user),
    });
  }
}
