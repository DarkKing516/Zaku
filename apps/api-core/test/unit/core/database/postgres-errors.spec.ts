import { QueryFailedError } from 'typeorm';
import { isUniqueViolation } from '@core/database/postgres-errors';

function queryFailed(driverError: object): QueryFailedError {
  return new QueryFailedError('INSERT ...', [], Object.assign(new Error('driver'), driverError));
}

describe('isUniqueViolation', () => {
  it('detects a unique violation on the expected constraint', () => {
    expect(isUniqueViolation(queryFailed({ code: '23505', constraint: 'uq_users_email' }), 'uq_users_email')).toBe(true);
  });

  it('ignores other constraints, other error codes and non query errors', () => {
    expect(isUniqueViolation(queryFailed({ code: '23505', constraint: 'pk_users' }), 'uq_users_email')).toBe(false);
    expect(isUniqueViolation(queryFailed({ code: '23503', constraint: 'uq_users_email' }), 'uq_users_email')).toBe(false);
    expect(isUniqueViolation(new Error('boom'), 'uq_users_email')).toBe(false);
  });
});
