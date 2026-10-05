import { Injectable } from '@nestjs/common';
import { newestFirst } from '@common/pagination/newest-first';
import { Page, PageRequest } from '@common/pagination/page';
import { TenantRepositoryPort } from '../../application/ports/tenant.repository.port';
import { TenantSlugTakenError } from '../../domain/errors/tenant.errors';
import { Tenant, TenantSnapshot } from '../../domain/tenant';
import { TenantSlug } from '../../domain/value-objects/tenant-slug';

@Injectable()
export class InMemoryTenantRepository implements TenantRepositoryPort {
  private readonly snapshots = new Map<string, TenantSnapshot>();

  async save(tenant: Tenant): Promise<void> {
    const snapshot = tenant.toSnapshot();
    const slugOwner = [...this.snapshots.values()].find(
      (stored) => stored.slug === snapshot.slug && stored.id !== snapshot.id,
    );
    if (slugOwner) {
      throw new TenantSlugTakenError(snapshot.slug);
    }
    this.snapshots.set(snapshot.id, snapshot);
  }

  async findById(tenantId: string): Promise<Tenant | null> {
    const snapshot = this.snapshots.get(tenantId);
    return snapshot ? Tenant.restore(snapshot) : null;
  }

  async findBySlug(slug: TenantSlug): Promise<Tenant | null> {
    const snapshot = [...this.snapshots.values()].find((stored) => stored.slug === slug.value);
    return snapshot ? Tenant.restore(snapshot) : null;
  }

  async findPage(request: PageRequest): Promise<Page<Tenant>> {
    const ordered = [...this.snapshots.values()].sort(newestFirst);
    const offset = Page.offsetOf(request);
    const items = ordered.slice(offset, offset + request.pageSize).map((snapshot) => Tenant.restore(snapshot));
    return new Page(items, request.page, request.pageSize, ordered.length);
  }
}
