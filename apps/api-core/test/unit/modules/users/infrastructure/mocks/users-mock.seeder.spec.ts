import { DEMO_TENANT, DEMO_USER } from '@core/mocking/demo-fixtures';
import { InMemoryUserRepository } from '@modules/users/infrastructure/mocks/in-memory-user.repository';
import { UsersMockSeeder } from '@modules/users/infrastructure/mocks/users-mock.seeder';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { FakePasswordHasher } from '@test/support/fake-password-hasher';
import { buildMockSwitch } from '@test/support/mock-switch.fixture';

function seederFor(adapters: string, seedData: boolean) {
  const config = buildAppConfig({ mocks: { adapters, seedData } });
  const repository = new InMemoryUserRepository();
  return { seeder: new UsersMockSeeder(config, buildMockSwitch(config), repository, new FakePasswordHasher()), repository };
}

describe('UsersMockSeeder', () => {
  it('seeds the demo user with a stable id inside the demo tenant', async () => {
    const { seeder, repository } = seederFor('*', true);

    await seeder.onApplicationBootstrap();

    expect((await repository.findById(DEMO_TENANT.id, DEMO_USER.id))?.email).toBe(DEMO_USER.email);
  });

  it('does nothing when seeding is disabled', async () => {
    const { seeder, repository } = seederFor('*', false);

    await seeder.onApplicationBootstrap();

    expect(await repository.findById(DEMO_TENANT.id, DEMO_USER.id)).toBeNull();
  });

  it('refuses to boot instead of writing a known password into a real repository', async () => {
    const { seeder } = seederFor('tenants.*', true);

    await expect(seeder.onApplicationBootstrap()).rejects.toThrow(/users\.repository/);
  });
});
