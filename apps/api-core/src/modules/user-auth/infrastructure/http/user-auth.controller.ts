import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Secret } from '@common/security/secret';
import { ApiEnvelope } from '@core/http/decorators/api-envelope.decorator';
import { ResponseMessage } from '@core/http/decorators/response-message.decorator';
import { Idempotent } from '@core/idempotency/idempotent.decorator';
import { CredentialsRateLimit } from '@core/security/credentials-rate-limit.decorator';
import { Public } from '@core/security/public.decorator';
import { ApiTenantHeader } from '@core/tenancy/api-tenant-header.decorator';
import { CurrentTenantId } from '@core/tenancy/current-tenant-id.decorator';
import { CreateUserCommand, CreateUserRequestDto, UserResponseDto } from '@modules/users';
import { LoginUserCommand } from '../../application/commands/login-user/login-user.command';
import { LoginRequestDto } from './dtos/login.request.dto';
import { UserSessionResponseDto } from './dtos/user-session.response.dto';

@ApiTags('user-auth')
@Public()
@ApiTenantHeader()
@CredentialsRateLimit()
@Controller('user-auth')
export class UserAuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @Idempotent()
  @ResponseMessage('User registered')
  @ApiEnvelope(UserResponseDto, { status: HttpStatus.CREATED, errors: [400, 403, 409, 422, 429, 503] })
  async register(@CurrentTenantId() tenantId: string, @Body() body: CreateUserRequestDto): Promise<UserResponseDto> {
    const user = await this.commandBus.execute(new CreateUserCommand(tenantId, body.email, Secret.of(body.password)));
    return UserResponseDto.fromView(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful')
  @ApiEnvelope(UserSessionResponseDto, { errors: [400, 401, 403, 429, 503] })
  async login(@CurrentTenantId() tenantId: string, @Body() body: LoginRequestDto): Promise<UserSessionResponseDto> {
    const session = await this.commandBus.execute(new LoginUserCommand(tenantId, body.email, Secret.of(body.password)));
    return UserSessionResponseDto.fromView(session);
  }
}
