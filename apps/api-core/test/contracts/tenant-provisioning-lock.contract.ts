import { randomUUID } from 'node:crypto';
import { TenantProvisioningLockPort } from '@modules/tenants/application/ports/tenant-provisioning-lock.port';
import { TenantProvisioningInProgressError } from '@modules/tenants/domain/errors/tenant.errors';

function gate(): { readonly opened: Promise<void>; open(): void } {
  let open: () => void = () => undefined;
  const opened = new Promise<void>((resolve) => (open = resolve));
  return { opened, open };
}

export function describeTenantProvisioningLockContract(
  adapterName: string,
  createLock: () => TenantProvisioningLockPort | Promise<TenantProvisioningLockPort>,
): void {
  describe(`${adapterName} honours the TenantProvisioningLockPort contract`, () => {
    let lock: TenantProvisioningLockPort;

    beforeAll(async () => {
      lock = await createLock();
    });

    it('returns the result of the exclusive work', async () => {
      await expect(lock.runExclusively(randomUUID(), async () => 'done')).resolves.toBe('done');
    });

    it('rejects a second run for the same tenant while the first one holds the lock', async () => {
      const tenantId = randomUUID();
      const firstRunStarted = gate();
      const finishFirstRun = gate();
      const firstRun = lock.runExclusively(tenantId, async () => {
        firstRunStarted.open();
        await finishFirstRun.opened;
        return 'first';
      });
      await firstRunStarted.opened;

      await expect(lock.runExclusively(tenantId, async () => 'second')).rejects.toThrow(TenantProvisioningInProgressError);

      finishFirstRun.open();
      await expect(firstRun).resolves.toBe('first');
    });

    it('lets different tenants hold their locks at the same time', async () => {
      const bothStarted = [gate(), gate()];
      const finishBoth = gate();
      const runs = [randomUUID(), randomUUID()].map((tenantId, index) =>
        lock.runExclusively(tenantId, async () => {
          bothStarted[index].open();
          await finishBoth.opened;
          return tenantId;
        }),
      );

      await Promise.all(bothStarted.map((started) => started.opened));
      finishBoth.open();

      await expect(Promise.all(runs)).resolves.toHaveLength(2);
    });

    it('releases the lock when the work fails', async () => {
      const tenantId = randomUUID();
      await expect(
        lock.runExclusively(tenantId, async () => {
          throw new Error('provisioning exploded');
        }),
      ).rejects.toThrow('provisioning exploded');

      await expect(lock.runExclusively(tenantId, async () => 'retried')).resolves.toBe('retried');
    });
  });
}
