import { dropTenantDatabasesCreatedByTests, prepareControlDatabase } from './integration-database';

export default async function integrationGlobalSetup(): Promise<void> {
  await prepareControlDatabase();
  await dropTenantDatabasesCreatedByTests();
}
