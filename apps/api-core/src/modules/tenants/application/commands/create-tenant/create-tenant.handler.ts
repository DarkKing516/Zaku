import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TenantSlugTakenError } from '../../../domain/errors/tenant.errors';
import { Tenant } from '../../../domain/tenant';
import { TenantStatus } from '../../../domain/tenant-status';
import { TenantName } from '../../../domain/value-objects/tenant-name';
import { TenantSlug } from '../../../domain/value-objects/tenant-slug';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../ports/tenant.repository.port';
import { TenantProvisioningWorkflow } from '../../services/tenant-provisioning.workflow';
import { TenantView } from '../../views/tenant.view';
import { CreateTenantCommand } from './create-tenant.command';

const RESUMABLE_STATUSES: readonly TenantStatus[] = [TenantStatus.Provisioning, TenantStatus.Failed];

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepositoryPort,
    private readonly provisioningWorkflow: TenantProvisioningWorkflow,
  ) {}

  async execute(command: CreateTenantCommand): Promise<TenantView> {
    const slug = TenantSlug.create(command.slug);
    const name = TenantName.create(command.name);

    const existing = await this.tenants.findBySlug(slug);
    if (existing && RESUMABLE_STATUSES.includes(existing.status)) {
      return this.provisioningWorkflow.retryProvisioning(existing.id);
    }
    if (existing) {
      throw new TenantSlugTakenError(slug.value);
    }

    return this.provisioningWorkflow.provisionNewTenant(Tenant.register(slug, name));
  }
}
