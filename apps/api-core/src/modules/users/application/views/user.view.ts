import { User } from '../../domain/user';

export interface UserView {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function toUserView(tenantId: string, user: User): UserView {
  const { id, email, createdAt, updatedAt } = user.toSnapshot();
  return { id, tenantId, email, createdAt, updatedAt };
}
