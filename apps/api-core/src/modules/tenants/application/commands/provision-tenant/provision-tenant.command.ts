import { Command } from '@nestjs/cqrs';
import { TenantView } from '../../views/tenant.view';

export class ProvisionTenantCommand extends Command<TenantView> {
  constructor(readonly tenantId: string) {
    super();
  }
}
