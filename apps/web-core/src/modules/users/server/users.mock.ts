import 'server-only';
import { DEMO_TENANT_ID, DEMO_USER } from '@/shared/server/demo-fixtures';
import { fail, ok, type Paged, type Result } from '@/shared/server/http';
import type { UserResponse } from './contracts';

const DEMO_TEAM = [
  'ana.rios',
  'carlos.perez',
  'luisa.torres',
  'jorge.gomez',
  'camila.ospina',
  'diego.vargas',
  'sofia.martinez',
  'andres.lopez',
  'valentina.cruz',
  'mateo.herrera',
  'isabella.mora',
  'samuel.castro',
];
const SEED_START = Date.parse('2026-02-01T09:00:00.000Z');
const ONE_DAY_MS = 86_400_000;

function seedUsers(): UserResponse[] {
  const team = DEMO_TEAM.map((alias, index): UserResponse => {
    const createdAt = new Date(SEED_START + index * ONE_DAY_MS).toISOString();
    return {
      id: `00000000-0000-4000-8000-${String(200 + index).padStart(12, '0')}`,
      tenantId: DEMO_TENANT_ID,
      email: `${alias}@zaku.dev`,
      createdAt,
      updatedAt: createdAt,
    };
  });
  const demoUser: UserResponse = { id: DEMO_USER.id, tenantId: DEMO_TENANT_ID, email: DEMO_USER.email, createdAt: DEMO_USER.createdAt, updatedAt: DEMO_USER.createdAt };
  return [demoUser, ...team];
}

// globalThis keeps the data across dev hot reloads.
const store = globalThis as unknown as { __zakuUsersMock?: UserResponse[] };
const users = () => (store.__zakuUsersMock ??= seedUsers());

const newestFirst = (left: UserResponse, right: UserResponse) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id);

export const usersMock = {
  listPage(tenantId: string | undefined, page: number, pageSize: number): Result<Paged<UserResponse>> {
    if (!tenantId) {
      return fail(401, 'Tu sesión expiró. Inicia sesión nuevamente.', 'UNAUTHENTICATED');
    }
    const tenantUsers = users().filter((user) => user.tenantId === tenantId).sort(newestFirst);
    const offset = (page - 1) * pageSize;
    return ok({
      items: tenantUsers.slice(offset, offset + pageSize),
      pagination: { page, pageSize, totalItems: tenantUsers.length, totalPages: Math.ceil(tenantUsers.length / pageSize) },
    });
  },
};
