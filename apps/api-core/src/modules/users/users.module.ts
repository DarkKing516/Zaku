import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { provideSwitchableAdapter } from '@core/mocking/provide-switchable-adapter';
import { CreateUserHandler } from './application/commands/create-user/create-user.handler';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { USER_REPOSITORY, UserRepositoryPort } from './application/ports/user.repository.port';
import { GetUserByIdHandler } from './application/queries/get-user-by-id/get-user-by-id.handler';
import { ListUsersHandler } from './application/queries/list-users/list-users.handler';
import { VerifyUserCredentialsHandler } from './application/queries/verify-user-credentials/verify-user-credentials.handler';
import { BcryptPasswordHasher } from './infrastructure/adapters/bcrypt-password.hasher';
import { UsersController } from './infrastructure/http/users.controller';
import { InMemoryUserRepository } from './infrastructure/mocks/in-memory-user.repository';
import { UsersMockSeeder } from './infrastructure/mocks/users-mock.seeder';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/typeorm-user.repository';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/user.orm-entity';
import { UsersAdapterKeys } from './infrastructure/users-adapter-keys';

@Module({
  imports: [DatabaseModule.forFeature({ tenant: [UserOrmEntity] })],
  controllers: [UsersController],
  providers: [
    CreateUserHandler,
    GetUserByIdHandler,
    ListUsersHandler,
    VerifyUserCredentialsHandler,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    provideSwitchableAdapter<UserRepositoryPort>({
      provide: USER_REPOSITORY,
      key: UsersAdapterKeys.repository,
      real: TypeOrmUserRepository,
      mock: InMemoryUserRepository,
    }),
    UsersMockSeeder,
  ],
})
export class UsersModule {}
