import { createParamDecorator } from '@nestjs/common';
import { RequestContext } from '../request-context/request-context';

export function currentTenantIdOrFail(): string {
  const tenantId = RequestContext.current()?.tenantId;
  if (!tenantId) {
    throw new Error('@CurrentTenantId() cannot be used on a @TenantAgnostic() route');
  }
  return tenantId;
}

export const CurrentTenantId = createParamDecorator((): string => currentTenantIdOrFail());
