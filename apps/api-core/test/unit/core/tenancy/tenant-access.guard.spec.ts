import { Reflector } from '@nestjs/core';
import { RequestContext } from '@core/request-context/request-context';
import { PrincipalType } from '@core/security/authenticated-principal';
import { TenantUnavailableError } from '@core/tenancy/tenancy.errors';
import { TenantAccessCheckerPort } from '@core/tenancy/tenant-access-checker.port';
import { TenantAccessGuard } from '@core/tenancy/tenant-access.guard';
import { TenantAgnostic } from '@core/tenancy/tenant-agnostic.decorator';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { fakeRequest, httpExecutionContext } from '@test/support/http-execution-context';

const activeTenant = '0a000000-0000-4000-8000-00000000000a';
const inactiveTenant = '0b000000-0000-4000-8000-00000000000b';

class CountingTenantAccessChecker implements TenantAccessCheckerPort {
  readonly checkedTenantIds: string[] = [];

  async isTenantActive(tenantId: string): Promise<boolean> {
    this.checkedTenantIds.push(tenantId);
    return tenantId === activeTenant;
  }
}

class TenantController {
  handle(): void {}
}

@TenantAgnostic()
class PlatformController {
  handle(): void {}
}

describe('TenantAccessGuard', () => {
  let checker: CountingTenantAccessChecker;

  beforeEach(() => {
    checker = new CountingTenantAccessChecker();
  });

  function run(
    guard: TenantAccessGuard,
    controller: typeof TenantController | typeof PlatformController,
    headers: Record<string, string>,
    principalTenantId?: string,
  ) {
    const context = httpExecutionContext(fakeRequest({ headers }), controller, controller.prototype.handle);
    return RequestContext.run({ requestId: 'test' }, async () => {
      if (principalTenantId) {
        RequestContext.bindPrincipal({ subjectId: 'user-1', tenantId: principalTenantId, type: PrincipalType.User });
      }
      const allowed = await guard.canActivate(context);
      return { allowed, tenantId: RequestContext.current()?.tenantId };
    });
  }

  function guardWithCacheTtl(tenantStatusCacheTtlMs: number): TenantAccessGuard {
    return new TenantAccessGuard(new Reflector(), buildAppConfig({ tenantStatusCacheTtlMs }), checker);
  }

  it('binds an active tenant taken from the header', async () => {
    await expect(run(guardWithCacheTtl(0), TenantController, { 'x-tenant-id': activeTenant })).resolves.toEqual({
      allowed: true,
      tenantId: activeTenant,
    });
  });

  it('binds the tenant of the authenticated principal', async () => {
    await expect(run(guardWithCacheTtl(0), TenantController, {}, activeTenant)).resolves.toMatchObject({
      tenantId: activeTenant,
    });
  });

  it('answers the same error for unknown and inactive tenants', async () => {
    await expect(run(guardWithCacheTtl(0), TenantController, { 'x-tenant-id': inactiveTenant })).rejects.toThrow(
      TenantUnavailableError,
    );
  });

  it('skips tenant resolution on tenant agnostic routes', async () => {
    await expect(run(guardWithCacheTtl(0), PlatformController, {})).resolves.toEqual({
      allowed: true,
      tenantId: undefined,
    });
    expect(checker.checkedTenantIds).toEqual([]);
  });

  it('caches only active tenants for the configured time', async () => {
    const guard = guardWithCacheTtl(60_000);

    await run(guard, TenantController, { 'x-tenant-id': activeTenant });
    await run(guard, TenantController, { 'x-tenant-id': activeTenant });
    await expect(run(guard, TenantController, { 'x-tenant-id': inactiveTenant })).rejects.toThrow();
    await expect(run(guard, TenantController, { 'x-tenant-id': inactiveTenant })).rejects.toThrow();

    expect(checker.checkedTenantIds).toEqual([activeTenant, inactiveTenant, inactiveTenant]);
  });
});
