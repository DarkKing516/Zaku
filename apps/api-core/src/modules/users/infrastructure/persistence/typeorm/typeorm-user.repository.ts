import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Page, PageRequest } from '@common/pagination/page';
import { isUniqueViolation } from '@core/database/postgres-errors';
import { TenantDataSourceManager } from '@core/database/tenant-data-source.manager';
import { UserRepositoryPort } from '../../../application/ports/user.repository.port';
import { UserAlreadyExistsError } from '../../../domain/errors/user.errors';
import { User } from '../../../domain/user';
import { Email } from '../../../domain/value-objects/email';
import { toUserDomain, toUserOrmEntity } from './user-orm.mapper';
import { USER_EMAIL_UNIQUE_CONSTRAINT, UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepositoryPort {
  constructor(private readonly tenantDataSources: TenantDataSourceManager) {}

  async save(tenantId: string, user: User): Promise<void> {
    const repository = await this.repository(tenantId);
    try {
      await repository.save(toUserOrmEntity(user));
    } catch (error) {
      if (isUniqueViolation(error, USER_EMAIL_UNIQUE_CONSTRAINT)) {
        throw new UserAlreadyExistsError(user.email);
      }
      throw error;
    }
  }

  async findById(tenantId: string, userId: string): Promise<User | null> {
    const entity = await (await this.repository(tenantId)).findOneBy({ id: userId });
    return entity ? toUserDomain(entity) : null;
  }

  async findByEmail(tenantId: string, email: Email): Promise<User | null> {
    const entity = await (await this.repository(tenantId)).findOneBy({ email: email.value });
    return entity ? toUserDomain(entity) : null;
  }

  async findPage(tenantId: string, request: PageRequest): Promise<Page<User>> {
    const [entities, totalItems] = await (await this.repository(tenantId)).findAndCount({
      order: { createdAt: 'DESC', id: 'ASC' },
      skip: Page.offsetOf(request),
      take: request.pageSize,
    });
    return new Page(entities.map(toUserDomain), request.page, request.pageSize, totalItems);
  }

  private async repository(tenantId: string): Promise<Repository<UserOrmEntity>> {
    return (await this.tenantDataSources.dataSourceFor(tenantId)).getRepository(UserOrmEntity);
  }
}
