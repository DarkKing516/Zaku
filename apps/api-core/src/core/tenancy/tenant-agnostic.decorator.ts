import { SetMetadata } from '@nestjs/common';

export const IS_TENANT_AGNOSTIC_ROUTE = 'tenancy:is-tenant-agnostic-route';

export const TenantAgnostic = (): MethodDecorator & ClassDecorator => SetMetadata(IS_TENANT_AGNOSTIC_ROUTE, true);
