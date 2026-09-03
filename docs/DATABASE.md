# DATABASE

- TypeORM con `synchronize: false`.
- Cambios de schema por migrations en `packages/database-lib/src/migrations`.
- Índices críticos por tenant (`tenant_id`) y unicidad por tenant cuando aplique.
