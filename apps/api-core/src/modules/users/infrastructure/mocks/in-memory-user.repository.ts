import { Injectable } from '@nestjs/common';
import { newestFirst } from '@common/pagination/newest-first';
import { Page, PageRequest } from '@common/pagination/page';
import { UserRepositoryPort } from '../../application/ports/user.repository.port';
import { UserAlreadyExistsError } from '../../domain/errors/user.errors';
import { User, UserSnapshot } from '../../domain/user';
import { Email } from '../../domain/value-objects/email';

@Injectable()
export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly snapshotsByTenant = new Map<string, Map<string, UserSnapshot>>();

  async save(tenantId: string, user: User): Promise<void> {
    const tenantUsers = this.tenantUsers(tenantId);
    const snapshot = user.toSnapshot();
    const emailOwner = [...tenantUsers.values()].find(
      (stored) => stored.email === snapshot.email && stored.id !== snapshot.id,
    );
    if (emailOwner) {
      throw new UserAlreadyExistsError(snapshot.email);
    }
    tenantUsers.set(snapshot.id, snapshot);
  }

  async findById(tenantId: string, userId: string): Promise<User | null> {
    const snapshot = this.tenantUsers(tenantId).get(userId);
    return snapshot ? User.restore(snapshot) : null;
  }

  async findByEmail(tenantId: string, email: Email): Promise<User | null> {
    const snapshot = [...this.tenantUsers(tenantId).values()].find((stored) => stored.email === email.value);
    return snapshot ? User.restore(snapshot) : null;
  }

  async findPage(tenantId: string, request: PageRequest): Promise<Page<User>> {
    const ordered = [...this.tenantUsers(tenantId).values()].sort(newestFirst);
    const offset = Page.offsetOf(request);
    const items = ordered.slice(offset, offset + request.pageSize).map((snapshot) => User.restore(snapshot));
    return new Page(items, request.page, request.pageSize, ordered.length);
  }

  private tenantUsers(tenantId: string): Map<string, UserSnapshot> {
    let tenantUsers = this.snapshotsByTenant.get(tenantId);
    if (!tenantUsers) {
      tenantUsers = new Map();
      this.snapshotsByTenant.set(tenantId, tenantUsers);
    }
    return tenantUsers;
  }
}
