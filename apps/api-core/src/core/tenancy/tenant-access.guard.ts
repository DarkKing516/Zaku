import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AppConfig } from '../config/app-config';
import { RequestContext } from '../request-context/request-context';
import { TenantUnavailableError } from './tenancy.errors';
import { TENANT_ID_HEADER } from './tenancy.constants';
import { TENANT_ACCESS_CHECKER, TenantAccessCheckerPort } from './tenant-access-checker.port';
import { IS_TENANT_AGNOSTIC_ROUTE } from './tenant-agnostic.decorator';
import { resolveRequestedTenantId } from './tenant-id-header';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  private readonly activeUntilByTenantId = new Map<string, number>();

  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfig,
    @Inject(TENANT_ACCESS_CHECKER) private readonly tenantAccessChecker: TenantAccessCheckerPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isTenantAgnosticRoute = this.reflector.getAllAndOverride<boolean>(IS_TENANT_AGNOSTIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isTenantAgnosticRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = resolveRequestedTenantId(request.header(TENANT_ID_HEADER), RequestContext.current()?.principal);
    await this.assertTenantIsActive(tenantId);
    RequestContext.bindTenant(tenantId);
    return true;
  }

  private async assertTenantIsActive(tenantId: string): Promise<void> {
    const activeUntil = this.activeUntilByTenantId.get(tenantId);
    if (activeUntil !== undefined && activeUntil > Date.now()) {
      return;
    }
    this.activeUntilByTenantId.delete(tenantId);

    if (!(await this.tenantAccessChecker.isTenantActive(tenantId))) {
      throw new TenantUnavailableError();
    }
    if (this.config.tenantStatusCacheTtlMs > 0) {
      this.activeUntilByTenantId.set(tenantId, Date.now() + this.config.tenantStatusCacheTtlMs);
    }
  }
}
