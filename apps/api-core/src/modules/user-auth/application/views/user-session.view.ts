import type { UserView } from '@modules/users';
import { IssuedAccessToken } from '../ports/access-token-issuer.port';

export interface UserSessionView extends IssuedAccessToken {
  readonly user: UserView;
}
