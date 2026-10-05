import { AsyncLocalStorage } from 'node:async_hooks';
import type { AuthenticatedPrincipal } from '../security/authenticated-principal';

export interface RequestContextState {
  readonly requestId: string;
  tenantId?: string;
  principal?: AuthenticatedPrincipal;
}

const storage = new AsyncLocalStorage<RequestContextState>();

function requireState(): RequestContextState {
  const state = storage.getStore();
  if (!state) {
    throw new Error('Request context is not initialized; RequestContextMiddleware must run first');
  }
  return state;
}

function isSamePrincipal(left: AuthenticatedPrincipal, right: AuthenticatedPrincipal): boolean {
  return left.subjectId === right.subjectId && left.tenantId === right.tenantId && left.type === right.type;
}

export const RequestContext = {
  run<TResult>(state: RequestContextState, callback: () => TResult): TResult {
    return storage.run(state, callback);
  },

  current(): RequestContextState | undefined {
    return storage.getStore();
  },

  bindPrincipal(principal: AuthenticatedPrincipal): void {
    const state = requireState();
    if (state.principal && !isSamePrincipal(state.principal, principal)) {
      throw new Error('Request principal is already bound to a different principal');
    }
    state.principal = principal;
  },

  bindTenant(tenantId: string): void {
    const state = requireState();
    if (state.tenantId && state.tenantId !== tenantId) {
      throw new Error('Request tenant is already bound to a different tenant');
    }
    state.tenantId = tenantId;
  },
};
