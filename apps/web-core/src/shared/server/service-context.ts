import 'server-only';

export interface ServiceContext {
  readonly requestId: string;
  readonly ip: string;
  readonly tenantId?: string;
  readonly accessToken?: string;
}

export interface ServiceIdentity {
  readonly tenantId?: string;
  readonly accessToken?: string;
}

const DEFAULT_IP = '0.0.0.0';

// Only trust x-forwarded-for when the app runs behind a proxy that overwrites it.
export function clientIpOf(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || headers.get('x-real-ip') || DEFAULT_IP;
}

export function createServiceContext(headers: Headers, identity: ServiceIdentity = {}, requestId: string = crypto.randomUUID()): ServiceContext {
  return { requestId, ip: clientIpOf(headers), ...identity };
}
