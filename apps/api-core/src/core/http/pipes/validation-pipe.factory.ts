import { ValidationPipe } from '@nestjs/common';
import { RequestValidationError } from '../request-validation.errors';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => RequestValidationError.fromValidationErrors(errors),
  });
}
