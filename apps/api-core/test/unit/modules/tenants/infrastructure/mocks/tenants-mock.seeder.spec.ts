import { DEMO_TENANT } from '@core/mocking/demo-fixtures';
import { InMemoryTenantRepository } from '@modules/tenants/infrastructure/mocks/in-memory-tenant.repository';
import { TenantsMockSeeder } from '@modules/tenants/infrastructure/mocks/tenants-mock.seeder';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { buildMockSwitch } from '@test/support/mock-switch.fixture';

function seederFor(adapters: string, seedData: boolean, repository = new InMemoryTenantRepository()) {
  const config = buildAppConfig({ mocks: { adapters, seedData } });
  return { seeder: new TenantsMockSeeder(config, buildMockSwitch(config), repository), repository };
}

describe('TenantsMockSeeder', () => {
  it('seeds the demo tenant when seeding is enabled and the repository is mocked', async () => {
    const { seeder, repository } = seederFor('tenants.*', true);

    await seeder.onApplicationBootstrap();

    expect((await repository.findById(DEMO_TENANT.id))?.status).toBe('ACTIVE');
  });

  it('does nothing when seeding is disabled', async () => {
    const { seeder, repository } = seederFor('*', false);

    await seeder.onApplicationBootstrap();

    expect(await repository.findById(DEMO_TENANT.id)).toBeNull();
  });

  it('refuses to boot instead of writing demo data into a real repository', async () => {
    const { seeder } = seederFor('users.*', true);

    await expect(seeder.onApplicationBootstrap()).rejects.toThrow(/tenants\.repository/);
  });
});
