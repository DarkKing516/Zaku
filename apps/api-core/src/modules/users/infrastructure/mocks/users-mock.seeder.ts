import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AppConfig } from '@core/config/app-config';
import { DEMO_SEEDED_AT, DEMO_TENANT, DEMO_USER, seedDataRequiresMockError } from '@core/mocking/demo-fixtures';
import { MockSwitch } from '@core/mocking/mock-switch';
import { PASSWORD_HASHER, PasswordHasherPort } from '../../application/ports/password-hasher.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../application/ports/user.repository.port';
import { User } from '../../domain/user';
import { UsersAdapterKeys } from '../users-adapter-keys';

@Injectable()
export class UsersMockSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly config: AppConfig,
    private readonly mockSwitch: MockSwitch,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.mocks.seedData) {
      return;
    }
    if (!this.mockSwitch.isMocked(UsersAdapterKeys.repository)) {
      throw seedDataRequiresMockError(UsersAdapterKeys.repository);
    }
    const demoUser = User.restore({
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      passwordHash: await this.passwordHasher.hash(DEMO_USER.password),
      createdAt: DEMO_SEEDED_AT,
      updatedAt: DEMO_SEEDED_AT,
    });
    await this.users.save(DEMO_TENANT.id, demoUser);
  }
}
