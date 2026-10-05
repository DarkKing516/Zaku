import { AppError } from '@common/errors/app-error';
import { TENANT_ID_HEADER } from './tenancy.constants';

export class TenantHeaderRequiredError extends AppError {
  constructor() {
    super({
      code: 'TENANT_HEADER_REQUIRED',
      category: 'VALIDATION',
      message: `The ${TENANT_ID_HEADER} header is required for this operation`,
    });
  }
}

export class TenantHeaderInvalidError extends AppError {
  constructor() {
    super({
      code: 'TENANT_HEADER_INVALID',
      category: 'VALIDATION',
      message: `The ${TENANT_ID_HEADER} header must be a UUID`,
    });
  }
}

export class TenantMismatchError extends AppError {
  constructor() {
    super({
      code: 'TENANT_MISMATCH',
      category: 'FORBIDDEN',
      message: `The ${TENANT_ID_HEADER} header does not match the tenant of the access token`,
    });
  }
}

export class TenantUnavailableError extends AppError {
  constructor() {
    super({
      code: 'TENANT_UNAVAILABLE',
      category: 'FORBIDDEN',
      message: 'The tenant does not exist or is not active',
    });
  }
}
