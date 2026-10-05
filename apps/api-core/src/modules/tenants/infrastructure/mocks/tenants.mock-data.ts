import { DEMO_SEEDED_AT, DEMO_TENANT } from '@core/mocking/demo-fixtures';
import { TenantSnapshot } from '../../domain/tenant';
import { TenantStatus } from '../../domain/tenant-status';

export const DEMO_TENANT_SNAPSHOT: TenantSnapshot = {
  id: DEMO_TENANT.id,
  slug: DEMO_TENANT.slug,
  name: DEMO_TENANT.name,
  status: TenantStatus.Active,
  provisioningError: null,
  createdAt: DEMO_SEEDED_AT,
  updatedAt: DEMO_SEEDED_AT,
};
