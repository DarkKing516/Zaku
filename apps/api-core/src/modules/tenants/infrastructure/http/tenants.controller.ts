import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Page } from '@common/pagination/page';
import { ApiEnvelope } from '@core/http/decorators/api-envelope.decorator';
import { ResponseMessage } from '@core/http/decorators/response-message.decorator';
import { PaginationQueryDto } from '@core/http/dtos/pagination-query.dto';
import { parseUuid } from '@core/http/pipes/parse-uuid.pipe';
import { Idempotent } from '@core/idempotency/idempotent.decorator';
import { Public } from '@core/security/public.decorator';
import { TenantAgnostic } from '@core/tenancy/tenant-agnostic.decorator';
import { CreateTenantCommand } from '../../application/commands/create-tenant/create-tenant.command';
import { ProvisionTenantCommand } from '../../application/commands/provision-tenant/provision-tenant.command';
import { GetTenantByIdQuery } from '../../application/queries/get-tenant-by-id/get-tenant-by-id.query';
import { ListTenantsQuery } from '../../application/queries/list-tenants/list-tenants.query';
import { CreateTenantRequestDto } from './dtos/create-tenant.request.dto';
import { TenantResponseDto } from './dtos/tenant.response.dto';

const PROVISIONING_IDEMPOTENCY_LOCK_TTL_MS = 5 * 60_000;

@ApiTags('tenants')
@Public()
@TenantAgnostic()
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Idempotent({ required: true, lockTtlMs: PROVISIONING_IDEMPOTENCY_LOCK_TTL_MS })
  @ResponseMessage('Tenant created')
  @ApiEnvelope(TenantResponseDto, { status: HttpStatus.CREATED, errors: [400, 409, 422, 503] })
  async create(@Body() body: CreateTenantRequestDto): Promise<TenantResponseDto> {
    const tenant = await this.commandBus.execute(new CreateTenantCommand(body.slug, body.name));
    return TenantResponseDto.fromView(tenant);
  }

  @Get()
  @ApiEnvelope(TenantResponseDto, { paginated: true, errors: [400] })
  async list(@Query() pagination: PaginationQueryDto): Promise<Page<TenantResponseDto>> {
    const page = await this.queryBus.execute(new ListTenantsQuery(pagination));
    return page.map((view) => TenantResponseDto.fromView(view));
  }

  @Get(':tenantId')
  @ApiEnvelope(TenantResponseDto, { errors: [400, 404] })
  async getById(@Param('tenantId', parseUuid('tenantId')) tenantId: string): Promise<TenantResponseDto> {
    return TenantResponseDto.fromView(await this.queryBus.execute(new GetTenantByIdQuery(tenantId)));
  }

  @Post(':tenantId/provisioning')
  @HttpCode(HttpStatus.OK)
  @Idempotent({ lockTtlMs: PROVISIONING_IDEMPOTENCY_LOCK_TTL_MS })
  @ResponseMessage('Tenant provisioned')
  @ApiEnvelope(TenantResponseDto, { errors: [400, 404, 409, 503] })
  async provision(@Param('tenantId', parseUuid('tenantId')) tenantId: string): Promise<TenantResponseDto> {
    return TenantResponseDto.fromView(await this.commandBus.execute(new ProvisionTenantCommand(tenantId)));
  }
}
