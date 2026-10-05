import 'server-only';

// Same identities as api-core's MOCK_SEED_DATA, so mock mode and a seeded api-core describe the same tenant and user.
export const DEMO_TENANT_ID = '00000000-0000-4000-8000-000000000001';

export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000101',
  email: 'demo@zaku.dev',
  password: 'demo-password',
  createdAt: '2026-01-01T00:00:00.000Z',
} as const;
