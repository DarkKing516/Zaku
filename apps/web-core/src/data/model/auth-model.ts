export default interface AuthModel {
  user: UserInfo;
  accessToken: string;
}

export interface UserInfo {
  id?       : string;
  email     : string;
  tenantId? : string;
}
