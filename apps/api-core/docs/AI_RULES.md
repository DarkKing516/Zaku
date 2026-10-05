# AI_RULES · api-core

Reglas obligatorias para los agentes de IA (Claude, Cursor, Copilot…) que modifiquen `apps/api-core`. Se suman a las [reglas generales para agentes](../../../docs/AI_RULES.md), que también son obligatorias.

Son la versión condensada y ejecutable de:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CLEAN_CODE.md](./CLEAN_CODE.md)
- [DATABASE.md](./DATABASE.md) y el [DATABASE.md general](../../../docs/DATABASE.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)

Si hay dudas, mandan esos documentos. [ONBOARDING.md](./ONBOARDING.md) tiene un ejemplo completo de cómo añadir un endpoint (verificado con typecheck, lint y tests unitarios, de arquitectura y e2e).

## 1. Antes de escribir código

1. Lee la sección relevante de `ARCHITECTURE.md` y copia la estructura de un módulo existente:
   - `modules/users` es la referencia más simple;
   - `modules/tenants` incluye un servicio de aplicación, un lock y adapters de infraestructura no triviales.
2. Decide la ubicación en este orden:
   1. ¿Tiene lógica de negocio? → `modules/<x>/`.
   2. ¿Es infraestructura global con Nest, I/O o estado? → `core/<concern>/`.
   3. ¿Es TypeScript puro, sin frameworks? → `common/`.
3. No crees carpetas, capas, clases base ni dependencias nuevas sin una necesidad concreta y presente.

## 2. MUST

- **Estructura:** sigue la plantilla de módulo hexagonal:
  1. `domain/`
  2. `application/` (commands, queries, ports, views, services)
  3. `infrastructure/` (http, persistence, adapters, mocks)
  4. `<x>.module.ts`
  5. `index.ts`
- **Controllers:** solo despachan por `CommandBus`/`QueryBus` y mapean views a response DTOs.
- **Commands y queries:** extienden `Command<T>` / `Query<T>`. Es un command si muta estado o tiene efectos externos.
- **`tenantId`:** viaja explícito en los commands, las queries y los métodos de port que acceden a datos de la DB de un tenant.
- **Datos sensibles** (contraseñas, secretos): viajan como `Secret` y solo se llama a `.reveal()` donde se consumen.
- **I/O:** todo el I/O que se pide desde `application/` pasa por un **port** (interface + `Symbol`). Si el I/O es externo (DB, Redis, red, colas):
  - registra el adapter con `provideSwitchableAdapter`;
  - crea su mock en `infrastructure/mocks/`;
  - escribe una suite de contrato en `test/contracts/` que pasen el mock y el adapter real.
- **Errores esperados:** extienden `AppError` con un `code` estable y una `category`. Si añades un `code`, actualiza el catálogo de ARCHITECTURE §7.1.
- **Seguridad de rutas:** las rutas nuevas exigen autenticación y tenant por defecto. Usa `@Public()` / `@TenantAgnostic()` solo cuando sea intencional y explícalo en el PR.
- **Idempotencia:** decide según la tabla de ARCHITECTURE §8:
  - `required: true` cuando la operación crea recursos costosos o difíciles de deshacer;
  - opcional para las demás creaciones;
  - ninguna en operaciones que no crean nada.
- **Tests:**
  - todos en `apps/api-core/test/`; los unitarios en `test/unit/`, en la ruta espejo del archivo de `src/` que prueban, importando el código con aliases. Si mueves o renombras un archivo de `src/`, mueve su spec. Reglas que lo verifican: [CLEAN_CODE §7.1](./CLEAN_CODE.md#71-qué-verifica-el-architecture-test);
  - unitarios para cada handler, servicio de aplicación, regla de dominio y adapter sin I/O externo;
  - e2e para cada endpoint nuevo, donde cada `it` crea sus propios datos;
  - integración (suite de contrato) para cada adapter con I/O externo.
- **Cambios de esquema:** incluyen la migración en `packages/database-lib` **y** la entidad ORM en el módulo, en el mismo cambio.
- **Contrato HTTP:** si cambias un endpoint que consume web-core, actualiza `packages/shared-types` y el service de web-core en el mismo cambio.
- **Antes de terminar**, deben pasar:
  - `pnpm run ci`
  - si tocaste persistencia o Redis: `pnpm --filter api-core test:integration`

## 3. MUST NOT

- **Código prohibido en api-core:**
  - `process.env` fuera de `core/config` (excepciones: los scripts CLI de `packages/database-lib/src/scripts/` y `apps/api-core/scripts/`, que también pueden usar `console`, y el setup de los tests en `test/setup/` y `test/support/`);
  - `synchronize: true`.
- **Imports prohibidos por capa:**
  - `domain/` solo importa su propio dominio, `@common/*` y `node:*`.
  - `application/` no importa `infrastructure/`, `@core/*` ni librerías concretas (`typeorm`, `express`, `bcrypt`, `ioredis`, `@nestjs/jwt`, `@nestjs/swagger`).
  - `core/` y `common/` no importan `@modules/*`.
- **Otro módulo** solo se importa por `@modules/users`, nunca por una ruta profunda como `@modules/users/application/...`. Las únicas excepciones son `src/app.module.ts` y los tests.
- **Desde un `index.ts`** solo se exportan contratos: commands, queries, views, DTOs HTTP y, de `domain/`, enums `*-status`, value objects y errores. Nunca agregados, handlers, ports, adapters, mocks ni el `*.module.ts`.
- **No se inyectan servicios ni repositorios de otro módulo:** se usan sus commands y queries por el bus.
- **Adapters reales** (`TypeOrm*`, `Postgres*`, `Redis*`): no se registran fuera de `provideSwitchableAdapter`.
- **Respuestas y errores:** no se construye el envelope a mano y no se lanza `HttpException` desde dominio o aplicación.
- **Contratos publicados:**
  - no se edita una migración ya publicada;
  - no se cambia un `code` de error existente.
- **Tests en `src/`:** ningún `*.spec.ts`, `*.e2e-spec.ts`, `*.int-spec.ts`, `*.test.ts` ni `*.contract.ts` dentro de un `src/` (tampoco en `packages/*`). Tampoco helpers dentro de `test/unit/` (van en `test/support/`).
- **Tests de integración:** no los ejecutes contra una base de control que no termine en `_test`.

## 4. Checklist de entrega

- [ ] Ubicación correcta según la regla core / common / modules.
- [ ] Archivos con su sufijo de rol (`.command.ts`, `.port.ts`, `.orm-entity.ts`, `.contract.ts`…).
- [ ] Handler registrado en los `providers` de su módulo.
- [ ] Tests nuevos en `test/` (los unitarios en la ruta espejo de `test/unit/`), en verde y con la cobertura dentro del umbral (`test:cov`).
- [ ] Swagger actualizado con `@ApiEnvelope(...)` y la lista de errores posibles.
- [ ] Docs de api-core actualizadas (endpoints, variables de entorno, reglas, `code`s de error).
- [ ] El [checklist general](../../../docs/AI_RULES.md#4-checklist-de-entrega) también está completo.
