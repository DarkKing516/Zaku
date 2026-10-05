# CLEAN_CODE · api-core

Reglas de código propias de `apps/api-core`. Aplican igual a personas y a agentes de IA.

Antes, lee las [reglas generales del monorepo](../../../docs/CLEAN_CODE.md): directrices anti-slop, TypeScript, tests fuera de `src/`, commits y checklist de PR. Este documento solo añade lo específico de api-core (NestJS, hexagonal + CQRS-lite y TypeORM).

## 1. Cómo se verifican

Además de TypeScript `strict` y ESLint ([verificaciones generales](../../../docs/CLEAN_CODE.md#1-cómo-se-hacen-cumplir)), api-core tiene:

| Verificación | Qué controla |
|---|---|
| Architecture test (`test/architecture`) | Dependencias entre capas y módulos, API pública de los módulos, contratos tipados, registro de handlers, wiring de adapters, lectura de `process.env` y ubicación de los tests. Lista completa en §7.1. |
| Umbral de cobertura (`test:cov`) | Mínimos de cobertura (§7.3). |

## 2. TypeScript en api-core

Además de las [reglas generales de TypeScript](../../../docs/CLEAN_CODE.md#3-typescript):

- **Enums de dominio:** se declaran como objeto `as const` más un tipo derivado (ej. `TenantStatus`). `RuntimeEnvironment`, el enum de la config, usa `enum` porque así lo valida `@IsEnum`.
- **Aserción de asignación definida (`prop!: T`):** solo se permite donde el framework inicializa la propiedad: DTOs, entidades ORM y `EnvironmentVariables` (class-transformer).
- **`process.env`:** solo se lee en `core/config`; el resto del código inyecta `AppConfig`. Las excepciones son los scripts CLI (`packages/database-lib/src/scripts/` y `apps/api-core/scripts/`), que también pueden usar `console`, y el setup de los tests (`test/setup/`, `test/support/`).
- **TypeORM:** nunca `synchronize: true`. El esquema solo cambia mediante migraciones.

## 3. Nombres

### 3.1 Archivos: `kebab-case` + sufijo de rol

| Rol | Sufijo | Ejemplo |
|---|---|---|
| Agregado / entidad de dominio | `.ts` | `tenant.ts` |
| Value object | `value-objects/<nombre>.ts` | `value-objects/tenant-slug.ts` |
| Errores (agrupados por concepto) | `.errors.ts` | `tenant.errors.ts`, `idempotency.errors.ts` |
| Command / Query | `.command.ts` / `.query.ts` | `create-tenant.command.ts` |
| Handler (al lado de su command/query) | `.handler.ts` | `create-tenant.handler.ts` |
| Port | `.port.ts` | `tenant.repository.port.ts` |
| View | `.view.ts` | `tenant.view.ts` |
| Servicio de aplicación | `.workflow.ts` / `.service.ts` | `tenant-provisioning.workflow.ts` |
| Controller | `.controller.ts` | `tenants.controller.ts` |
| DTO HTTP | `.request.dto.ts` / `.response.dto.ts` | `create-tenant.request.dto.ts` |
| Entidad ORM | `.orm-entity.ts` | `tenant.orm-entity.ts` |
| Mapper ORM | `-orm.mapper.ts` | `tenant-orm.mapper.ts` |
| Repositorio real | `typeorm-<x>.repository.ts` | `typeorm-tenant.repository.ts` |
| Otros adapters reales | `<tecnología o estrategia>-<x>.<rol>.ts` | `bcrypt-password.hasher.ts`, `jwt-access-token.issuer.ts`, `postgres-tenant-provisioning.lock.ts`, `repository-tenant-access.checker.ts` |
| Mock | `in-memory-<x>.<rol>.ts` | `in-memory-user.repository.ts` |
| Datos y seeder de mock | `.mock-data.ts` / `-mock.seeder.ts` | `tenants.mock-data.ts` |
| Claves de adapters | `<modulo>-adapter-keys.ts` | `users-adapter-keys.ts` |
| Infraestructura de `core` | `.middleware.ts`, `.guard.ts`, `.interceptor.ts`, `.filter.ts`, `.pipe.ts`, `.factory.ts`, `.manager.ts`, `.decorator.ts`, `.constants.ts` | `tenant-access.guard.ts`, `validation-pipe.factory.ts` |
| Conexión dedicada | `-database.ts` | `control-plane-database.ts`, `tenant-provisioning-database.ts` |
| Módulo Nest | `.module.ts` | `tenants.module.ts` |
| Test unitario (en `test/unit/`, misma ruta que el archivo en `src/`) | `.spec.ts` | `test/unit/modules/tenants/domain/tenant.spec.ts` |
| Test e2e / integración (en `test/e2e/` y `test/integration/`) | `.e2e-spec.ts` / `.int-spec.ts` | `tenants.e2e-spec.ts` |
| Suite de contrato (en `test/contracts/`) | `.contract.ts` | `user-repository.contract.ts` |
| Stub de una librería para Jest (en `test/support/`) | `.stub.ts` | `scalar-api-reference.stub.ts` |

### 3.2 Código

Además de las [reglas generales de nombres](../../../docs/CLEAN_CODE.md#4-nombres):

- **Tokens de inyección:** `Symbol('NOMBRE_PORT')`, exportado junto a la interface (`USER_REPOSITORY` + `UserRepositoryPort`).
- **Commands y queries:**
  - commands en imperativo (`CreateTenantCommand`);
  - queries como pregunta (`GetTenantByIdQuery`, `VerifyUserCredentialsQuery`).
- **Errores:**
  - clase con el formato `<Concepto><Problema>Error` (ej. `TenantSlugTakenError`);
  - `code` en `UPPER_SNAKE_CASE`, con el prefijo del módulo o del concern (`TENANT_`, `USER_`, `USER_AUTH_`, `AUTH_TOKEN_`, `IDEMPOTENCY_`, `DATABASE_`);
  - el catálogo completo está en [ARCHITECTURE.md §7.1](./ARCHITECTURE.md#71-errores).
  - **Un `code` publicado nunca cambia.**
- **Booleanos en config y opciones:** se aceptan nombres de flag (`swaggerEnabled`, `required`).

## 4. Imports

- **Dentro** de una misma área (`common`, `core` o un mismo módulo), los imports son relativos.
- **Entre** áreas se usan los aliases: `@common/*`, `@core/*`, `@modules/<modulo>` y `@test/*` (este último solo en tests).
- Los tests importan el código de producción **siempre** con aliases (`@modules/users/domain/user`), nunca con rutas relativas hacia `src/`. Única excepción: `src/app.module.ts`, que no tiene alias (lo importa `test/support/test-app.ts`).
- Otro módulo se importa **solo** por su raíz (`@modules/users`).
  - Excepciones: `src/app.module.ts`, que es el composition root e importa los `*.module.ts`, y los tests. Aun así, el spec de un módulo llega a **otros** módulos solo por su `index.ts`.
- No hay barrels (`index.ts`), salvo la API pública de cada módulo.
- Los contratos de `@zaku/shared-types` se importan con `import type`.

## 5. Errores

- Los errores esperados extienden `AppError` y declaran `code` + `category`. Nunca se lanza `HttpException` desde `domain/` ni desde `application/`.
- `throw new Error(...)` se reserva para errores de programación o invariantes imposibles (terminan en 500).
- Los adapters traducen los errores técnicos a errores de dominio (ej. `isUniqueViolation(error, 'uq_users_email')` → `UserAlreadyExistsError`).
- El mensaje de un `AppError` llega al cliente, así que no puede contener SQL, nombres de DB ni stacks. El detalle técnico va en `cause`.
- Los datos sensibles (contraseñas, tokens de terceros) viajan como `Secret`.

## 6. Diseño

Además de los [principios generales de diseño](../../../docs/CLEAN_CODE.md#5-diseño):

- **Responsabilidades:** un handler por caso de uso.
- **Dependencias:** se inyectan por constructor. Desde `application/`, el I/O se pide siempre a través de un port. Los adapters de `infrastructure/` sí pueden usar directamente las piezas de `core` (ej. `ControlPlaneDatabase`).
- **Inmutabilidad por defecto:** commands, queries, views y value objects son de solo lectura.
- **Agregados:** exponen **comportamiento** (ej. `completeProvisioning()`), no setters.

## 7. Tests

Las [reglas generales de tests](../../../docs/CLEAN_CODE.md#6-tests) aplican completas. En api-core todos los tests están en `test/`, y `test/unit/` es espejo de `src/`:

```text
src/modules/users/domain/user.ts  →  test/unit/modules/users/domain/user.spec.ts
```

`nest g` no genera specs (`generateOptions.spec: false` en `nest-cli.json`).

`infrastructure/mocks/` no son tests: es código de `src/` que solo se activa con `MOCK_ADAPTERS` (prohibido en producción) y que los tests reutilizan como fakes.

### 7.1 Qué verifica el architecture test

Esta es la lista completa; los demás documentos enlazan aquí.

`test/architecture/dependency-rules.spec.ts` revisa el código de `src/`:

- `common/` no usa frameworks ni importa nada interno, y `core/` nunca importa `modules/`;
- `domain/` y `application/` solo importan lo que permite su allowlist ([ARCHITECTURE §2.2](./ARCHITECTURE.md#22-regla-de-dependencias));
- otro módulo se importa solo por su `index.ts`, y dentro del mismo módulo los imports son relativos;
- `index.ts` solo reexporta commands, queries, views, DTOs de `infrastructure/http/dtos/` y, de `domain/`, enums `*-status`, value objects y errores (nunca agregados);
- todo command y query extiende `Command<T>` / `Query<T>` y tiene su handler al lado, registrado en los `providers` de su módulo;
- los adapters reales (`TypeOrm*`, `Postgres*`, `Redis*`) solo se cablean con `provideSwitchableAdapter`;
- solo `core/config` lee `process.env`.

`test/architecture/test-layout.spec.ts` revisa dónde viven los tests:

- no hay archivos de test (`*.spec.ts`, `*.e2e-spec.ts`, `*.int-spec.ts`, `*.test.ts`, `*.contract.ts`) en `src/`;
- cada spec de `test/unit/` tiene su archivo en `src/` con la misma ruta, respetando mayúsculas y minúsculas, y lo importa;
- cada archivo de test está en la carpeta cuyo proyecto de Jest lo ejecuta, y los helpers solo viven en `test/support/` o `test/setup/` (en cualquier otra carpeta, el test falla);
- los tests importan `src/` por aliases; la única ruta relativa permitida es `src/app.module.ts`, que no tiene alias;
- el spec de un módulo solo llega a otros módulos por su `index.ts`.

### 7.2 Qué se prueba y dónde

| Qué | Dónde | Cómo |
|---|---|---|
| Dominio (agregados, VOs, políticas) | `test/unit/modules/<x>/domain/**/*.spec.ts` | Puro, sin Nest. |
| Handlers y servicios de aplicación (cada uno con su spec) | `test/unit/modules/<x>/application/**/*.spec.ts` | `new Handler(fakes)` usando los adapters en memoria de `infrastructure/mocks/` y los fakes de `test/support/`. |
| Interacción entre módulos | spec del handler | Bus real (`CqrsModule.forRoot()`) + un handler stub del otro módulo, importando solo su `index.ts`. |
| Ports conmutables | `test/contracts/*.contract.ts` | Una suite que se ejecuta contra el mock (unit) y contra el adapter real (integración). |
| Adapters **sin** I/O externo (bcrypt, JWT, mappers), guards, interceptors, utilidades de `core` | `test/unit/`, en la ruta espejo del archivo | Unitarios. Para guards e interceptors: `ExecutionContextHost` real (`test/support/http-execution-context.ts`). |
| API completa | `test/e2e/*.e2e-spec.ts` | `createTestApp()` en modo mock, con supertest. **Cada `it` crea sus propios datos.** |
| Adapters **con** I/O externo (TypeORM, Postgres, Redis) | `test/integration/*.int-spec.ts` | Contra Postgres y Redis de Docker: suites de contrato + test de drift ORM ↔ migraciones. |
| Reglas de arquitectura | `test/architecture/` | Escaneo de imports y de la ubicación de los tests (§7.1). |

### 7.3 Reglas propias de api-core

- **Fakes:** los fakes de los ports son los adapters en memoria de `infrastructure/mocks/`.
- **Cobertura:** `pnpm --filter api-core test:cov` ejecuta el proyecto `unit` (tests unitarios y de arquitectura; los e2e no cuentan) y exige:
  - en cada archivo de `domain/` y `application/` de los módulos, 90% de líneas, 80% de ramas y 85% de funciones;
  - en el resto del código, en conjunto, 65% de líneas y 70% de ramas.
- **Librerías que solo publican ESM:** Jest corre en CommonJS y no puede cargarlas. Se mapean a un stub en `moduleNameMapper` de `jest.config.ts` (ej. `@scalar/nestjs-api-reference` → `test/support/scalar-api-reference.stub.ts`).

## 8. Checklist antes de abrir un PR

Además del [checklist general](../../../docs/CLEAN_CODE.md#8-checklist-antes-de-abrir-un-pr):

- [ ] Si se tocó persistencia o Redis: `pnpm --filter api-core test:integration` en verde (con `pnpm infra:up`).
- [ ] Tests nuevos para cada caso de uso, regla de dominio y adapter. Suite de contrato si se agregó un port conmutable.
- [ ] Swagger actualizado con `@ApiEnvelope(...)` y la lista de errores posibles.
- [ ] Si cambió un contrato HTTP o un `code` de error: `packages/shared-types`, el catálogo de [ARCHITECTURE §7.1](./ARCHITECTURE.md#71-errores) y el consumidor en web-core, en el mismo PR.
