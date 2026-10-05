import { TenantNameInvalidError } from '@modules/tenants/domain/errors/tenant.errors';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';

describe('TenantName', () => {
  it('trims and collapses inner whitespace', () => {
    expect(TenantName.create('  Acme    Corp ').value).toBe('Acme Corp');
  });

  it.each(['', ' a ', 'x'.repeat(101)])('rejects %p', (rawName) => {
    expect(() => TenantName.create(rawName)).toThrow(TenantNameInvalidError);
  });
});
