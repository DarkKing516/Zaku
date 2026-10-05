import { ValidationError } from 'class-validator';
import { RequestValidationError } from '@core/http/request-validation.errors';

function validationError(property: string, constraints: Record<string, string>, children: ValidationError[] = []) {
  return Object.assign(new ValidationError(), { property, constraints, children });
}

describe('RequestValidationError', () => {
  it('flattens nested validation errors into field paths', () => {
    const error = RequestValidationError.fromValidationErrors([
      validationError('email', { isEmail: 'email must be an email' }),
      validationError('address', {}, [validationError('zipCode', { isPostalCode: 'zipCode must be a postal code' })]),
    ]);

    expect(error).toMatchObject({ code: 'VALIDATION_FAILED', category: 'VALIDATION' });
    expect(error.details).toEqual([
      { field: 'email', message: 'email must be an email' },
      { field: 'address.zipCode', message: 'zipCode must be a postal code' },
    ]);
  });
});
