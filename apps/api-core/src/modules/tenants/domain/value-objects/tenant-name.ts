import { TenantNameInvalidError } from '../errors/tenant.errors';

const MIN_LENGTH = 2;
const MAX_LENGTH = 100;

export class TenantName {
  private constructor(readonly value: string) {}

  static create(rawName: string): TenantName {
    const name = rawName.trim().replace(/\s+/g, ' ');
    if (name.length < MIN_LENGTH || name.length > MAX_LENGTH) {
      throw new TenantNameInvalidError();
    }
    return new TenantName(name);
  }
}
