import { AppError } from '@common/errors/app-error';
import { TenantStatus } from '../tenant-status';

export class TenantSlugInvalidError extends AppError {
  constructor(slug: string) {
    super({
      code: 'TENANT_SLUG_INVALID',
      category: 'VALIDATION',
      message: `Tenant slug "${slug}" must be 3-40 lowercase letters, digits or single dashes`,
      details: [{ field: 'slug', message: 'must match ^[a-z0-9]+(-[a-z0-9]+)*$ with 3-40 characters' }],
    });
  }
}

export class TenantNameInvalidError extends AppError {
  constructor() {
    super({
      code: 'TENANT_NAME_INVALID',
      category: 'VALIDATION',
      message: 'Tenant name must have between 2 and 100 characters',
      details: [{ field: 'name', message: 'must have between 2 and 100 characters' }],
    });
  }
}

export class TenantSlugTakenError extends AppError {
  constructor(slug: string) {
    super({ code: 'TENANT_SLUG_TAKEN', category: 'CONFLICT', message: `Tenant slug "${slug}" is already in use` });
  }
}

export class TenantNotFoundError extends AppError {
  constructor(tenantId: string) {
    super({ code: 'TENANT_NOT_FOUND', category: 'NOT_FOUND', message: `Tenant "${tenantId}" was not found` });
  }
}

export class TenantNotProvisionableError extends AppError {
  constructor(tenantId: string, status: TenantStatus) {
    super({
      code: 'TENANT_NOT_PROVISIONABLE',
      category: 'CONFLICT',
      message: `Tenant "${tenantId}" cannot be provisioned while ${status}`,
    });
  }
}

export class TenantProvisioningFailedError extends AppError {
  constructor(tenantId: string, cause: unknown) {
    super({
      code: 'TENANT_PROVISIONING_FAILED',
      category: 'UNAVAILABLE',
      message: `Provisioning of tenant "${tenantId}" failed and can be retried`,
      details: [{ field: 'tenantId', message: tenantId }],
      cause,
    });
  }
}

export class TenantProvisioningInProgressError extends AppError {
  constructor(tenantId: string) {
    super({
      code: 'TENANT_PROVISIONING_IN_PROGRESS',
      category: 'CONFLICT',
      message: `Tenant "${tenantId}" is already being provisioned`,
    });
  }
}
