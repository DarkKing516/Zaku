import { DataSource } from 'typeorm';

export function initializedFakeDataSource(databaseName: string, destroyedDatabases: string[]): DataSource {
  const dataSource = new DataSource({ type: 'postgres', database: databaseName });
  Object.defineProperty(dataSource, 'isInitialized', { value: true, configurable: true });
  dataSource.destroy = async () => {
    destroyedDatabases.push(databaseName);
  };
  return dataSource;
}
