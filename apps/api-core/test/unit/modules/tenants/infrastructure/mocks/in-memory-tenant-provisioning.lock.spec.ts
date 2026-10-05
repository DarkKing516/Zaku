import { InMemoryTenantProvisioningLock } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-provisioning.lock';
import { describeTenantProvisioningLockContract } from '@test/contracts/tenant-provisioning-lock.contract';

describeTenantProvisioningLockContract('InMemoryTenantProvisioningLock', () => new InMemoryTenantProvisioningLock());
