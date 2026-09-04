import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  userId: string;
}

const storage = new AsyncLocalStorage<TenantContext>();

export const tenantContext = {
  set: (ctx: TenantContext): void => {
    storage.enterWith(ctx);
  },
  run: async <T>(ctx: TenantContext, callback: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      storage.run(ctx, async () => {
        try {
          resolve(await callback());
        } catch (error) {
          reject(error);
        }
      });
    }),
  get: (): TenantContext => {
    const ctx = storage.getStore();
    if (!ctx) {
      throw new Error('No context');
    }
    return ctx;
  },
  getTenantId: (): string => tenantContext.get().tenantId,
};
