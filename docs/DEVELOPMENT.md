# DEVELOPMENT

Guía para poner en marcha y trabajar en el monorepo completo. Lo específico de cada app (variables de entorno, scripts, guías paso a paso y tests) está en su propia guía:

- [apps/api-core/docs/DEVELOPMENT.md](../apps/api-core/docs/DEVELOPMENT.md)
- [apps/web-core/docs/DEVELOPMENT.md](../apps/web-core/docs/DEVELOPMENT.md)

## 1. Requisitos

- **Node 22.12+** (CI usa 22). Es la versión mínima que exige api-core ([por qué](../apps/api-core/docs/DEVELOPMENT.md#1-requisitos)).
- **pnpm 9.1.** Para activarlo:

  ```bash
  corepack enable && corepack prepare pnpm@9.1.0 --activate
  ```

- **Docker Desktop**, para Postgres y Redis. No hace falta si trabajas en modo mock.

## 2. Primer arranque

1. Instala las dependencias:

   ```bash
   pnpm install
   ```

2. Compila los paquetes y las apps. Los comandos de la raíz (`pnpm dev`, `pnpm typecheck`…) compilan antes los paquetes por su cuenta, pero los de una sola app (`pnpm --filter <app> …`) no: sin este paso fallan con `Cannot find module '@zaku/…'`.

   ```bash
   pnpm build
   ```

3. Elige cómo quieres trabajar:

   | Modo | Qué arrancas | ¿Docker? | Para qué sirve |
   |---|---|---|---|
   | **Solo web-core con mocks** | web-core | No | Trabajar en pantallas sin backend. Es el modo por defecto de web-core. |
   | **web-core + api-core en modo mock** | las dos apps: api-core con `MOCK_ADAPTERS=*` y `MOCK_SEED_DATA=true`, y los services de web-core pasados a REAL | No | Probar la integración entre apps sin bases de datos. |
   | **Todo real** | `pnpm infra:up`, `pnpm db:migration:run`, las dos apps y los services de web-core en REAL | Sí | Trabajar con persistencia real, migraciones o idempotencia. Los datos de demo no existen: crea un tenant y un usuario con el [flujo curl de api-core](../apps/api-core/docs/DEVELOPMENT.md#5-endpoints-actuales) y entra en web-core con ellos. |

   Cada app explica su configuración:
   - [api-core: modo real y modo mock](../apps/api-core/docs/DEVELOPMENT.md#2-puesta-en-marcha);
   - [web-core: puesta en marcha](../apps/web-core/docs/DEVELOPMENT.md#1-puesta-en-marcha) y [cómo pasar un service de MOCK a REAL](../apps/web-core/docs/DEVELOPMENT.md#3-mock-o-real).

4. Arranca. `pnpm dev` levanta las dos apps en modo watch:
   - api-core necesita `apps/api-core/.env`;
   - web-core necesita `apps/web-core/.env.local`.

   Para arrancar solo una:

   ```bash
   pnpm --filter web-core dev
   ```

| Servicio | Dirección |
|---|---|
| web-core | `http://localhost:3001` |
| api-core | `http://localhost:3000/api/v1` (documentación en `/api/documentation/swagger` y `/api/documentation/scalar`) |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

**Datos de demo**, iguales en los mocks de las dos apps (en modo real no existen):

- organización (tenant): `00000000-0000-4000-8000-000000000001`;
- usuario: `demo@zaku.dev`;
- contraseña: `demo-password`.

## 3. Comandos de la raíz

Turbo ejecuta cada comando en todos los workspaces, siempre compilando antes los paquetes de los que dependen (`dependsOn: ["^build"]`).

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Arranca las apps en watch: api-core con `nest start --watch` y web-core con `next dev --port 3001`. |
| `pnpm build` | Compila paquetes y apps (los paquetes primero). |
| `pnpm lint` | ESLint en api-core; ESLint y la frontera cliente/servidor (`check:boundaries`) en web-core; typecheck en los paquetes. |
| `pnpm typecheck` | `tsc --noEmit` en todo el monorepo. En web-core antes genera los tipos de rutas (`next typegen`). |
| `pnpm test` | Tests de todos los workspaces, sin Docker: unit + architecture + e2e de api-core (modo mock), unit + architecture de web-core y los de `database-lib`. |
| `pnpm run ci` | lint + typecheck + test + cobertura de api-core + build + smoke test de api-core, igual que el job `validate` de CI (§5). Usa `run`: `pnpm ci` es un comando interno de pnpm. |
| `pnpm infra:up` / `pnpm infra:down` | Levanta / detiene Postgres + Redis en Docker. |
| `pnpm db:migration:run` | Crea y migra el control plane y migra todas las DBs de tenant ([DATABASE §5.2](./DATABASE.md#52-comandos)). |

Para ejecutar el script de un solo workspace: `pnpm --filter <nombre> <script>` (ej. `pnpm --filter api-core test:integration`, `pnpm --filter web-core test:cov`).

## 4. Infraestructura local

`infra/docker-compose.yml` levanta:

| Servicio | Imagen | Configuración |
|---|---|---|
| PostgreSQL | `postgres:16-alpine` | Usuario, contraseña y base inicial desde `DATABASE_USER`, `DATABASE_PASSWORD` y `CONTROL_DATABASE_NAME` de la shell. Si no están definidas: `postgres` / `postgres` / `zaku_control`. Los datos persisten en el volumen `postgres-data`. |
| Redis | `redis:7-alpine` | Sin contraseña. Lo usa api-core para la idempotencia. |

Ambos tienen healthcheck. `infra/init-scripts/` está reservado para scripts de inicialización opcionales; hoy no contiene ninguno.

## 5. Integración continua

`.github/workflows/ci.yml` se ejecuta en cada push y en cada pull request, con dos jobs:

| Job | Qué hace |
|---|---|
| `validate` | Node 22 + pnpm 9.1.0, `pnpm install --frozen-lockfile` y después, en orden: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --filter api-core test:cov`, `pnpm build` y `pnpm --filter api-core smoke`. |
| `integration` | Levanta Postgres 16 y Redis 7 como servicios, compila los paquetes y ejecuta `pnpm --filter api-core test:integration`. |

`pnpm run ci` reproduce el job `validate` en tu máquina. El job `integration` necesita Docker: ejecútalo en local con `pnpm infra:up` y `pnpm --filter api-core test:integration`.

> Los umbrales de cobertura de web-core se comprueban con `pnpm --filter web-core test:cov`, que hoy no forma parte de `pnpm run ci` ni del job `validate`. Ejecútalo antes de abrir un PR que toque web-core.

## 6. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `Cannot find module '@zaku/database-lib'` o `'@zaku/shared-types'` al arrancar o en typecheck | Paquetes sin compilar. | `pnpm build`. |
| `pnpm ci` no ejecuta las verificaciones | `pnpm ci` es un comando interno de pnpm. | `pnpm run ci`. |
| `EADDRINUSE` al arrancar una app | Otro proceso usa el puerto 3000 o 3001. | Detener ese proceso. `pnpm dev` de web-core usa el 3001 para no chocar con api-core, pero `start` usa el 3000 de Next si no le pasas `--port` ([web-core §4](../apps/web-core/docs/DEVELOPMENT.md#4-scripts)). |

Problemas propios de cada app: [api-core](../apps/api-core/docs/DEVELOPMENT.md#8-problemas-frecuentes) · [web-core](../apps/web-core/docs/DEVELOPMENT.md#7-problemas-frecuentes).
