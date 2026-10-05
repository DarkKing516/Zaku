import { parseUuid } from '@core/http/pipes/parse-uuid.pipe';
import { RequestValidationError } from '@core/http/request-validation.errors';

describe('parseUuid', () => {
  it('normalizes UUIDs to lowercase so mock and real adapters see the same id', () => {
    expect(parseUuid('tenantId').transform('3F2A1B4C-0000-4000-8000-00000000000A')).toBe(
      '3f2a1b4c-0000-4000-8000-00000000000a',
    );
  });

  it('rejects malformed ids with a field level validation error', () => {
    expect(() => parseUuid('tenantId').transform('not-a-uuid')).toThrow(RequestValidationError);
  });
});
