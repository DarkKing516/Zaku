import { isTenantDatabaseName, tenantDatabaseNameFor } from '../../../src/tenant/tenant-database-name';

describe('tenantDatabaseNameFor', () => {
  it('derives a lowercase name without dashes from the tenant id', () => {
    expect(tenantDatabaseNameFor('3F2A1B4C-0000-4000-8000-00000000000A')).toBe('zaku_t_3f2a1b4c00004000800000000000000a');
  });

  it('produces names accepted by the database name guard', () => {
    expect(isTenantDatabaseName(tenantDatabaseNameFor('3f2a1b4c-0000-4000-8000-00000000000a'))).toBe(true);
  });

  it('rejects ids that are not UUIDs to prevent SQL identifier injection', () => {
    expect(() => tenantDatabaseNameFor('acme"; DROP DATABASE x; --')).toThrow();
  });

  it.each(['zaku_t_short', 'other_3f2a1b4c00004000800000000000000a', 'zaku_t_3F2A1B4C00004000800000000000000A'])(
    'rejects malformed database name %s',
    (databaseName) => {
      expect(isTenantDatabaseName(databaseName)).toBe(false);
    },
  );
});
