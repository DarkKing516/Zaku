import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AppConfig } from '@core/config/app-config';
import { seedDataRequiresMockError } from '@core/mocking/demo-fixtures';
import { MockSwitch } from '@core/mocking/mock-switch';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../application/ports/tenant.repository.port';
import { Tenant } from '../../domain/tenant';
import { TenantsAdapterKeys } from '../tenants-adapter-keys';
import { DEMO_TENANT_SNAPSHOT } from './tenants.mock-data';

@Injectable()
export class TenantsMockSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly config: AppConfig,
    private readonly mockSwitch: MockSwitch,
    @Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepositoryPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.mocks.seedData) {
      return;
    }
    if (!this.mockSwitch.isMocked(TenantsAdapterKeys.repository)) {
      throw seedDataRequiresMockError(TenantsAdapterKeys.repository);
    }
    await this.tenants.save(Tenant.restore(DEMO_TENANT_SNAPSHOT));
  }
}
