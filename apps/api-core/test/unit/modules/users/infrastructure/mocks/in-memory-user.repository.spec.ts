import { InMemoryUserRepository } from '@modules/users/infrastructure/mocks/in-memory-user.repository';
import { describeUserRepositoryContract } from '@test/contracts/user-repository.contract';

describeUserRepositoryContract('InMemoryUserRepository', () => ({
  repository: new InMemoryUserRepository(),
  tenantA: '0a000000-0000-4000-8000-00000000000a',
  tenantB: '0b000000-0000-4000-8000-00000000000b',
}));
