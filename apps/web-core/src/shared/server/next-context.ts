import 'server-only';
import { headers } from 'next/headers';
import { createServiceContext, type ServiceContext } from './service-context';
import { getSession } from './session';

export async function getServerServiceContext(): Promise<ServiceContext> {
  const session = await getSession();
  return createServiceContext(await headers(), { tenantId: session.user?.tenantId, accessToken: session.accessToken });
}
