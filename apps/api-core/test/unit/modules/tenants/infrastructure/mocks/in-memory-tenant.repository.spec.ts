import { InMemoryTenantRepository } from '@modules/tenants/infrastructure/mocks/in-memory-tenant.repository';
import { describeTenantRepositoryContract } from '@test/contracts/tenant-repository.contract';

describeTenantRepositoryContract('InMemoryTenantRepository', () => new InMemoryTenantRepository());
