import { rememberedTenant, rememberTenant } from '@/modules/auth/server/remembered-tenant';

const mockCookieJar = new Map<string, { value: string; options?: unknown }>();
jest.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieJar.get(name),
    set: (name: string, value: string, options?: unknown) => mockCookieJar.set(name, { value, options }),
  }),
}));

describe('remembered tenant', () => {
  beforeEach(() => {
    mockCookieJar.clear();
  });

  it('stores the last tenant in an httpOnly cookie and reads it back', async () => {
    await rememberTenant('00000000-0000-4000-8000-000000000001');

    await expect(rememberedTenant()).resolves.toBe('00000000-0000-4000-8000-000000000001');
    expect(mockCookieJar.get('zaku-tenant')?.options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
  });

  it('ignores a tampered cookie', async () => {
    mockCookieJar.set('zaku-tenant', { value: '<script>' });

    await expect(rememberedTenant()).resolves.toBeUndefined();
  });
});
