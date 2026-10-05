import { dropTenantDatabasesCreatedByTests } from './integration-database';

export default async function integrationGlobalTeardown(): Promise<void> {
  await dropTenantDatabasesCreatedByTests();
}
