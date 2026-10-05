import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TenantProvisioningWorkflow } from '../../services/tenant-provisioning.workflow';
import { TenantView } from '../../views/tenant.view';
import { ProvisionTenantCommand } from './provision-tenant.command';

@CommandHandler(ProvisionTenantCommand)
export class ProvisionTenantHandler implements ICommandHandler<ProvisionTenantCommand> {
  constructor(private readonly provisioningWorkflow: TenantProvisioningWorkflow) {}

  execute(command: ProvisionTenantCommand): Promise<TenantView> {
    return this.provisioningWorkflow.retryProvisioning(command.tenantId);
  }
}
