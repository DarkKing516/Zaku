import { Page, PageRequest } from '@common/pagination/page';
import { User } from '../../domain/user';
import { Email } from '../../domain/value-objects/email';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  save(tenantId: string, user: User): Promise<void>;
  findById(tenantId: string, userId: string): Promise<User | null>;
  findByEmail(tenantId: string, email: Email): Promise<User | null>;
  findPage(tenantId: string, request: PageRequest): Promise<Page<User>>;
}
