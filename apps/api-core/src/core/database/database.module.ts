import { DynamicModule, Global, Module } from '@nestjs/common';
import { ControlPlaneDatabase } from './control-plane-database';
import { OrmEntityClass, OrmEntityRegistry } from './orm-entity-registry';
import { PostgresDataSourceFactory } from './postgres-data-source.factory';
import { TenantDataSourceManager } from './tenant-data-source.manager';

export interface DatabaseFeatureEntities {
  readonly controlPlane?: readonly OrmEntityClass[];
  readonly tenant?: readonly OrmEntityClass[];
}

@Module({})
class DatabaseFeatureModule {}

@Global()
@Module({
  providers: [PostgresDataSourceFactory, ControlPlaneDatabase, TenantDataSourceManager],
  exports: [PostgresDataSourceFactory, ControlPlaneDatabase, TenantDataSourceManager],
})
export class DatabaseModule {
  static forFeature(entities: DatabaseFeatureEntities): DynamicModule {
    OrmEntityRegistry.registerControlPlaneEntities(entities.controlPlane ?? []);
    OrmEntityRegistry.registerTenantEntities(entities.tenant ?? []);
    return { module: DatabaseFeatureModule };
  }
}
