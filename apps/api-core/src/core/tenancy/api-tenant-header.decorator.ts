import { ApiHeader } from '@nestjs/swagger';
import { TENANT_ID_HEADER } from './tenancy.constants';

export const ApiTenantHeader = (): MethodDecorator & ClassDecorator =>
  ApiHeader({
    name: TENANT_ID_HEADER,
    required: true,
    description: 'Tenant UUID. Only needed on public tenant routes; authenticated routes take the tenant from the token.',
  });
