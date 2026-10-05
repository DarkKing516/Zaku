import { TenantSlugInvalidError } from '@modules/tenants/domain/errors/tenant.errors';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';

describe('TenantSlug', () => {
  it('normalizes case and surrounding whitespace', () => {
    expect(TenantSlug.create('  Acme-Corp ').value).toBe('acme-corp');
  });

  it.each(['ab', 'a'.repeat(41), 'acme_corp', '-acme', 'acme-', 'ac--me', 'acme corp', 'acme.corp'])(
    'rejects %p',
    (rawSlug) => {
      expect(() => TenantSlug.create(rawSlug)).toThrow(TenantSlugInvalidError);
    },
  );
});
