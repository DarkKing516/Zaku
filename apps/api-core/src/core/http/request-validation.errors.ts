import { ValidationError } from 'class-validator';
import { AppError, ErrorDetail } from '@common/errors/app-error';

export class RequestValidationError extends AppError {
  constructor(details: readonly ErrorDetail[]) {
    super({ code: 'VALIDATION_FAILED', category: 'VALIDATION', message: 'Request validation failed', details });
  }

  static fromValidationErrors(errors: readonly ValidationError[]): RequestValidationError {
    return new RequestValidationError(flattenValidationErrors(errors));
  }
}

function flattenValidationErrors(errors: readonly ValidationError[], parentPath = ''): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath === '' ? error.property : `${parentPath}.${error.property}`;
    const ownDetails = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    return [...ownDetails, ...flattenValidationErrors(error.children ?? [], field)];
  });
}
