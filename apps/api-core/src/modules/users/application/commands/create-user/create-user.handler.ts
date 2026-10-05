import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserAlreadyExistsError } from '../../../domain/errors/user.errors';
import { assertPasswordMeetsPolicy } from '../../../domain/password-policy';
import { User } from '../../../domain/user';
import { Email } from '../../../domain/value-objects/email';
import { PASSWORD_HASHER, PasswordHasherPort } from '../../ports/password-hasher.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../ports/user.repository.port';
import { UserView, toUserView } from '../../views/user.view';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserView> {
    const email = Email.create(command.email);
    assertPasswordMeetsPolicy(command.password.reveal());

    if (await this.users.findByEmail(command.tenantId, email)) {
      throw new UserAlreadyExistsError(email.value);
    }

    const user = User.register(email, await this.passwordHasher.hash(command.password.reveal()));
    await this.users.save(command.tenantId, user);
    return toUserView(command.tenantId, user);
  }
}
