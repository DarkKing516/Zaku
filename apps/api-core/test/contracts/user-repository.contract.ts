import { randomUUID } from 'node:crypto';
import { newestFirst } from '@common/pagination/newest-first';
import { UserRepositoryPort } from '@modules/users/application/ports/user.repository.port';
import { UserAlreadyExistsError } from '@modules/users/domain/errors/user.errors';
import { User } from '@modules/users/domain/user';
import { Email } from '@modules/users/domain/value-objects/email';

export interface UserRepositoryContractContext {
  readonly repository: UserRepositoryPort;
  readonly tenantA: string;
  readonly tenantB: string;
}

function uniqueEmail(): Email {
  return Email.create(`contract-${randomUUID().slice(0, 8)}@example.com`);
}

export function describeUserRepositoryContract(
  adapterName: string,
  createContext: () => UserRepositoryContractContext | Promise<UserRepositoryContractContext>,
): void {
  describe(`${adapterName} honours the UserRepositoryPort contract`, () => {
    let context: UserRepositoryContractContext;

    beforeAll(async () => {
      context = await createContext();
    });

    it('round-trips a user by id and by email', async () => {
      const user = User.register(uniqueEmail(), 'hash');
      await context.repository.save(context.tenantA, user);

      expect((await context.repository.findById(context.tenantA, user.id))?.toSnapshot()).toEqual(user.toSnapshot());
      expect((await context.repository.findByEmail(context.tenantA, Email.create(user.email)))?.id).toBe(user.id);
    });

    it('rejects a duplicated email inside a tenant', async () => {
      const email = uniqueEmail();
      await context.repository.save(context.tenantA, User.register(email, 'hash'));

      await expect(context.repository.save(context.tenantA, User.register(email, 'hash'))).rejects.toThrow(
        UserAlreadyExistsError,
      );
    });

    it('allows the same email in another tenant and never leaks users across tenants', async () => {
      const email = uniqueEmail();
      const userInA = User.register(email, 'hash');
      await context.repository.save(context.tenantA, userInA);
      await context.repository.save(context.tenantB, User.register(email, 'hash'));

      await expect(context.repository.findById(context.tenantB, userInA.id)).resolves.toBeNull();
      expect((await context.repository.findByEmail(context.tenantB, email))?.id).not.toBe(userInA.id);
    });

    it('pages newest first, breaking ties by id, with accurate totals and consistent page boundaries', async () => {
      const totalBefore = (await context.repository.findPage(context.tenantA, { page: 1, pageSize: 1 })).totalItems;
      const created = [User.register(uniqueEmail(), 'hash'), User.register(uniqueEmail(), 'hash'), User.register(uniqueEmail(), 'hash')];
      for (const user of created) {
        await context.repository.save(context.tenantA, user);
      }
      const createdIds = new Set(created.map((user) => user.id));

      const wide = await context.repository.findPage(context.tenantA, { page: 1, pageSize: 50 });
      const firstTwo = await context.repository.findPage(context.tenantA, { page: 1, pageSize: 2 });
      const nextTwo = await context.repository.findPage(context.tenantA, { page: 2, pageSize: 2 });
      const wideSnapshots = wide.items.map((user) => user.toSnapshot());

      expect(wide.totalItems).toBe(totalBefore + 3);
      expect(wideSnapshots).toEqual([...wideSnapshots].sort(newestFirst));
      expect(wideSnapshots.filter((snapshot) => createdIds.has(snapshot.id))).toHaveLength(3);
      expect([...firstTwo.items, ...nextTwo.items].map((user) => user.id)).toEqual(
        wide.items.slice(0, 4).map((user) => user.id),
      );
    });
  });
}
