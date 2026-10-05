# @zaku/database-lib

Esquema de datos de Zaku: migraciones del control plane y de las DBs de tenant, naming de las DBs de tenant y scripts de migración. Lo usan api-core y sus propios scripts CLI.

Documentación completa (estrategia, esquema, reglas de migraciones y comandos): [docs/DATABASE.md](../../docs/DATABASE.md).

## Contenido

| Ruta | Qué es |
|---|---|
| `src/control-plane/migrations/` | Migraciones de `zaku_control` (tabla `tenants`), exportadas en `controlPlaneMigrations`. |
| `src/control-plane/data-source.ts` | DataSource para el CLI de TypeORM. |
| `src/tenant/migrations/` | Migraciones de cada DB de tenant, exportadas en `tenantMigrations`. |
| `src/tenant/tenant-database-name.ts` | `tenantDatabaseNameFor(tenantId)`: única fuente de verdad del nombre de la DB de un tenant. |
| `src/scripts/` | Crear el control plane y migrar todas las DBs de tenant. |
| `test/unit/` | Tests unitarios (espejo de `src/`). |

## Scripts

Desde la raíz, `pnpm db:migration:run` ejecuta el flujo completo. Por separado:

| Script | Qué hace |
|---|---|
| `build` | Compila a `dist/` (api-core lo carga desde ahí). |
| `db:control:create` | Crea la DB del control plane si no existe. |
| `migration:run:control` | Migra el control plane. |
| `migration:run:tenants` | Migra las DBs de los tenants `ACTIVE` y `SUSPENDED`. |
| `test` | Tests unitarios. |

`typeorm` es una `peerDependency`: la aporta api-core.
