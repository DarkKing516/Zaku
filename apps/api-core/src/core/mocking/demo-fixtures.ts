export const DEMO_TENANT = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'demo',
  name: 'Demo Tenant',
} as const;

export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000101',
  email: 'demo@zaku.dev',
  password: 'demo-password',
} as const;

export const DEMO_SEEDED_AT = new Date('2026-01-01T00:00:00.000Z');

export function seedDataRequiresMockError(adapterKey: string): Error {
  return new Error(`MOCK_SEED_DATA=true requires the "${adapterKey}" adapter to be mocked; demo data must never reach a real database`);
}
