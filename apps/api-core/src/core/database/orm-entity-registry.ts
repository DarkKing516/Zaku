export type OrmEntityClass = abstract new (...args: never[]) => object;

const controlPlaneEntities = new Set<OrmEntityClass>();
const tenantEntities = new Set<OrmEntityClass>();

export const OrmEntityRegistry = {
  registerControlPlaneEntities(entities: readonly OrmEntityClass[]): void {
    entities.forEach((entity) => controlPlaneEntities.add(entity));
  },

  registerTenantEntities(entities: readonly OrmEntityClass[]): void {
    entities.forEach((entity) => tenantEntities.add(entity));
  },

  controlPlaneEntities(): OrmEntityClass[] {
    return [...controlPlaneEntities];
  },

  tenantEntities(): OrmEntityClass[] {
    return [...tenantEntities];
  },
};
