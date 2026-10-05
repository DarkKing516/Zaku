import { TenantNotProvisionableError } from '@modules/tenants/domain/errors/tenant.errors';
import { Tenant } from '@modules/tenants/domain/tenant';
import { TenantStatus } from '@modules/tenants/domain/tenant-status';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';

function registerTenant(): Tenant {
  return Tenant.register(TenantSlug.create('acme'), TenantName.create('Acme Corp'));
}

describe('Tenant', () => {
  it('registers in PROVISIONING', () => {
    const tenant = registerTenant();

    expect(tenant.status).toBe(TenantStatus.Provisioning);
    expect(tenant.slug).toBe('acme');
    expect(tenant.toSnapshot()).toMatchObject({ slug: 'acme', name: 'Acme Corp', provisioningError: null });
  });

  it('becomes ACTIVE after a successful provisioning', () => {
    const tenant = registerTenant();

    tenant.beginProvisioning();
    tenant.completeProvisioning();

    expect(tenant.status).toBe(TenantStatus.Active);
  });

  it('records the failure reason and allows a retry from FAILED', () => {
    const tenant = registerTenant();
    tenant.failProvisioning('database server unreachable');

    expect(tenant.status).toBe(TenantStatus.Failed);
    expect(tenant.provisioningError).toBe('database server unreachable');

    tenant.beginProvisioning();
    expect(tenant.status).toBe(TenantStatus.Provisioning);
    expect(tenant.provisioningError).toBeNull();
  });

  it('truncates very long failure reasons', () => {
    const tenant = registerTenant();
    tenant.failProvisioning('x'.repeat(2000));

    expect(tenant.provisioningError).toHaveLength(500);
  });

  it('refuses to provision an ACTIVE tenant again', () => {
    const tenant = registerTenant();
    tenant.completeProvisioning();

    expect(() => tenant.beginProvisioning()).toThrow(TenantNotProvisionableError);
    expect(() => tenant.completeProvisioning()).toThrow(TenantNotProvisionableError);
    expect(() => tenant.failProvisioning('late failure')).toThrow(TenantNotProvisionableError);
  });

  it('restores from a snapshot without sharing mutable state', () => {
    const original = registerTenant();
    const snapshot = original.toSnapshot();
    const restored = Tenant.restore(snapshot);

    restored.completeProvisioning();

    expect(original.status).toBe(TenantStatus.Provisioning);
    expect(snapshot.status).toBe(TenantStatus.Provisioning);
  });
});
