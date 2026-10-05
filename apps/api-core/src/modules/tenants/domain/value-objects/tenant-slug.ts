import { TenantSlugInvalidError } from '../errors/tenant.errors';

export const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TENANT_SLUG_MIN_LENGTH = 3;
export const TENANT_SLUG_MAX_LENGTH = 40;

export class TenantSlug {
  private constructor(readonly value: string) {}

  static create(rawSlug: string): TenantSlug {
    const slug = rawSlug.trim().toLowerCase();
    if (slug.length < TENANT_SLUG_MIN_LENGTH || slug.length > TENANT_SLUG_MAX_LENGTH || !TENANT_SLUG_PATTERN.test(slug)) {
      throw new TenantSlugInvalidError(rawSlug);
    }
    return new TenantSlug(slug);
  }
}
