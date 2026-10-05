import { RequestContext } from '@core/request-context/request-context';
import { PrincipalType } from '@core/security/authenticated-principal';

const principal = { subjectId: 'user-1', tenantId: 'tenant-1', type: PrincipalType.User };

describe('RequestContext', () => {
  it('exposes the state only inside the run callback', async () => {
    await RequestContext.run({ requestId: 'req-1' }, async () => {
      await Promise.resolve();
      expect(RequestContext.current()?.requestId).toBe('req-1');
    });

    expect(RequestContext.current()).toBeUndefined();
  });

  it('isolates concurrent requests', async () => {
    const seen: string[] = [];
    await Promise.all(
      ['a', 'b'].map((requestId) =>
        RequestContext.run({ requestId }, async () => {
          await new Promise((resolve) => setTimeout(resolve, requestId === 'a' ? 10 : 0));
          seen.push(`${requestId}:${RequestContext.current()?.requestId}`);
        }),
      ),
    );

    expect(seen.sort()).toEqual(['a:a', 'b:b']);
  });

  it('binds principal and tenant once and rejects a conflicting rebind', () => {
    RequestContext.run({ requestId: 'req-1' }, () => {
      RequestContext.bindPrincipal(principal);
      RequestContext.bindTenant('tenant-1');
      RequestContext.bindTenant('tenant-1');

      expect(() => RequestContext.bindTenant('tenant-2')).toThrow();
      expect(() => RequestContext.bindPrincipal({ ...principal, subjectId: 'user-2' })).toThrow();
      expect(() => RequestContext.bindPrincipal({ ...principal, tenantId: 'tenant-2' })).toThrow();
      expect(RequestContext.current()).toMatchObject({ tenantId: 'tenant-1', principal });
    });
  });

  it('fails loudly when binding outside a request', () => {
    expect(() => RequestContext.bindTenant('tenant-1')).toThrow(/not initialized/);
  });
});
