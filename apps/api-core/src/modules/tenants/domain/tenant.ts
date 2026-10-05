import { randomUUID } from 'node:crypto';
import { TenantNotProvisionableError } from './errors/tenant.errors';
import { TenantStatus } from './tenant-status';
import { TenantName } from './value-objects/tenant-name';
import { TenantSlug } from './value-objects/tenant-slug';

const MAX_PROVISIONING_ERROR_LENGTH = 500;

export interface TenantSnapshot {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly status: TenantStatus;
  readonly provisioningError: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Tenant {
  private constructor(private state: TenantSnapshot) {}

  static register(slug: TenantSlug, name: TenantName): Tenant {
    const id = randomUUID();
    const now = new Date();
    return new Tenant({
      id,
      slug: slug.value,
      name: name.value,
      status: TenantStatus.Provisioning,
      provisioningError: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(snapshot: TenantSnapshot): Tenant {
    return new Tenant({ ...snapshot });
  }

  get id(): string {
    return this.state.id;
  }

  get slug(): string {
    return this.state.slug;
  }

  get status(): TenantStatus {
    return this.state.status;
  }

  get provisioningError(): string | null {
    return this.state.provisioningError;
  }

  beginProvisioning(): void {
    if (this.state.status !== TenantStatus.Provisioning && this.state.status !== TenantStatus.Failed) {
      throw new TenantNotProvisionableError(this.state.id, this.state.status);
    }
    this.transitionTo(TenantStatus.Provisioning, null);
  }

  completeProvisioning(): void {
    this.assertProvisioning();
    this.transitionTo(TenantStatus.Active, null);
  }

  failProvisioning(reason: string): void {
    this.assertProvisioning();
    this.transitionTo(TenantStatus.Failed, reason.slice(0, MAX_PROVISIONING_ERROR_LENGTH));
  }

  toSnapshot(): TenantSnapshot {
    return { ...this.state };
  }

  private assertProvisioning(): void {
    if (this.state.status !== TenantStatus.Provisioning) {
      throw new TenantNotProvisionableError(this.state.id, this.state.status);
    }
  }

  private transitionTo(status: TenantStatus, provisioningError: string | null): void {
    this.state = { ...this.state, status, provisioningError, updatedAt: new Date() };
  }
}
