import { AppError } from '@common/errors/app-error';
import { IDEMPOTENCY_KEY_HEADER } from './idempotency.constants';

export class IdempotencyKeyRequiredError extends AppError {
  constructor() {
    super({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      category: 'VALIDATION',
      message: `The ${IDEMPOTENCY_KEY_HEADER} header is required for this operation`,
    });
  }
}

export class IdempotencyKeyInvalidError extends AppError {
  constructor() {
    super({
      code: 'IDEMPOTENCY_KEY_INVALID',
      category: 'VALIDATION',
      message: `The ${IDEMPOTENCY_KEY_HEADER} header must have 8-255 visible ASCII characters`,
    });
  }
}

export class IdempotencyRequestInProgressError extends AppError {
  constructor() {
    super({
      code: 'IDEMPOTENCY_REQUEST_IN_PROGRESS',
      category: 'CONFLICT',
      message: 'A request with this idempotency key is still being processed',
    });
  }
}

export class IdempotencyKeyReusedError extends AppError {
  constructor() {
    super({
      code: 'IDEMPOTENCY_KEY_REUSED',
      category: 'BUSINESS_RULE',
      message: 'This idempotency key was already used with a different request payload',
    });
  }
}

export class IdempotencyStoreUnavailableError extends AppError {
  constructor(cause: unknown) {
    super({
      code: 'IDEMPOTENCY_STORE_UNAVAILABLE',
      category: 'UNAVAILABLE',
      message: 'Idempotency protection is temporarily unavailable',
      cause,
    });
  }
}
