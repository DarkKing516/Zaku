import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserNotFoundError } from '../../../domain/errors/user.errors';
import { USER_REPOSITORY, UserRepositoryPort } from '../../ports/user.repository.port';
import { UserView, toUserView } from '../../views/user.view';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  async execute(query: GetUserByIdQuery): Promise<UserView> {
    const user = await this.users.findById(query.tenantId, query.userId);
    if (!user) {
      throw new UserNotFoundError(query.userId);
    }
    return toUserView(query.tenantId, user);
  }
}
