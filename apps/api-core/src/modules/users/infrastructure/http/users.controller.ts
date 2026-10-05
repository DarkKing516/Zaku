import { Body, Controller, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Page } from '@common/pagination/page';
import { Secret } from '@common/security/secret';
import { ApiEnvelope } from '@core/http/decorators/api-envelope.decorator';
import { ResponseMessage } from '@core/http/decorators/response-message.decorator';
import { PaginationQueryDto } from '@core/http/dtos/pagination-query.dto';
import { parseUuid } from '@core/http/pipes/parse-uuid.pipe';
import { Idempotent } from '@core/idempotency/idempotent.decorator';
import { CurrentTenantId } from '@core/tenancy/current-tenant-id.decorator';
import { CreateUserCommand } from '../../application/commands/create-user/create-user.command';
import { GetUserByIdQuery } from '../../application/queries/get-user-by-id/get-user-by-id.query';
import { ListUsersQuery } from '../../application/queries/list-users/list-users.query';
import { CreateUserRequestDto } from './dtos/create-user.request.dto';
import { UserResponseDto } from './dtos/user.response.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Idempotent()
  @ResponseMessage('User created')
  @ApiEnvelope(UserResponseDto, { status: HttpStatus.CREATED, errors: [400, 401, 403, 409, 422, 503] })
  async create(@CurrentTenantId() tenantId: string, @Body() body: CreateUserRequestDto): Promise<UserResponseDto> {
    const user = await this.commandBus.execute(new CreateUserCommand(tenantId, body.email, Secret.of(body.password)));
    return UserResponseDto.fromView(user);
  }

  @Get()
  @ApiEnvelope(UserResponseDto, { paginated: true, errors: [400, 401, 403, 503] })
  async list(
    @CurrentTenantId() tenantId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<Page<UserResponseDto>> {
    const page = await this.queryBus.execute(new ListUsersQuery(tenantId, pagination));
    return page.map((view) => UserResponseDto.fromView(view));
  }

  @Get(':userId')
  @ApiEnvelope(UserResponseDto, { errors: [400, 401, 403, 404, 503] })
  async getById(
    @CurrentTenantId() tenantId: string,
    @Param('userId', parseUuid('userId')) userId: string,
  ): Promise<UserResponseDto> {
    return UserResponseDto.fromView(await this.queryBus.execute(new GetUserByIdQuery(tenantId, userId)));
  }
}
