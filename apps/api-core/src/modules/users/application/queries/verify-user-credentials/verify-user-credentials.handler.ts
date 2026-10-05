import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Email } from '../../../domain/value-objects/email';
import { PASSWORD_HASHER, PasswordHasherPort } from '../../ports/password-hasher.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../ports/user.repository.port';
import { UserView, toUserView } from '../../views/user.view';
import { VerifyUserCredentialsQuery } from './verify-user-credentials.query';

@QueryHandler(VerifyUserCredentialsQuery)
export class VerifyUserCredentialsHandler implements IQueryHandler<VerifyUserCredentialsQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(query: VerifyUserCredentialsQuery): Promise<UserView | null> {
    const email = Email.tryCreate(query.email);
    const user = email ? await this.users.findByEmail(query.tenantId, email) : null;
    const passwordMatches = await this.passwordHasher.verify(query.password.reveal(), user?.passwordHash ?? null);
    return user && passwordMatches ? toUserView(query.tenantId, user) : null;
  }
}
