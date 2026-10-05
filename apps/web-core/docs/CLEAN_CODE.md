# CLEAN_CODE · web-core

Reglas de código propias de `apps/web-core`. Aplican igual a personas y a agentes de IA.

Antes, lee las [reglas generales del monorepo](../../../docs/CLEAN_CODE.md): directrices anti-slop, TypeScript, tests fuera de `src/`, commits y checklist de PR. Este documento solo añade lo específico de web-core (Next.js, React y el BFF).

## 1. Cómo se verifican

| Verificación | Qué controla |
|---|---|
| TypeScript `strict` (`pnpm typecheck`) | Tipos, incluidos los de las rutas (`next typegen` genera `PageProps<'/ruta'>`). |
| ESLint (`pnpm lint`) | Las reglas generales ([CLEAN_CODE general §1](../../../docs/CLEAN_CODE.md#1-cómo-se-hacen-cumplir)) más las de React Hooks, incluidas las del React Compiler. |
| Frontera cliente/servidor (`pnpm check:boundaries`, dentro de `pnpm lint`) | Que el código del navegador no importe código de servidor (detalle en [ARCHITECTURE §5](./ARCHITECTURE.md#5-separación-cliente--servidor)). |
| Architecture tests (`test/architecture`) | Capas, privacidad de `server/`, marcas `server-only`, lector de entorno, switch mock ⇄ real, rutas del BFF y ubicación de los tests. Lista completa en §7.1. |
| Umbral de cobertura (`pnpm test:cov`) | Mínimos de cobertura (§7.3). |
| Code review | Todo lo demás. |

## 2. TypeScript, React y Next.js

Además de las [reglas generales de TypeScript](../../../docs/CLEAN_CODE.md#3-typescript):

- **Server Components por defecto.** `'use client'` solo en componentes con estado, efectos o eventos del navegador, y lo más abajo posible en el árbol.
- **`import 'server-only'`** como primera línea de todo archivo de una carpeta `server/`. Única excepción: un archivo cuyo contenido es una sola línea `export type { … } from '…';` (no tiene código que ejecutar).
- **`process.env`** solo en `shared/server/env.ts`. Una variable nueva se añade a su schema y a `.env.example`.
- **Nada de `NEXT_PUBLIC_*`** para secretos ni para URLs internas.
- **Logs:** nada de `console.*`; se usa `logger` (`shared/server/logger.ts`), que oculta los datos sensibles. Es el único archivo con `console` (ESLint lo permite solo ahí).
- **APIs asíncronas de Next 16:** `cookies()`, `headers()`, `params` y `searchParams` se esperan con `await`.
- **Datos externos:** todo lo que viene de la URL, de un formulario o de un body se valida con un schema de zod antes de usarse.
- **`allowUnreachableCode: true`** existe solo por el switch mock ⇄ real ([ARCHITECTURE §8](./ARCHITECTURE.md#8-switch-mock--real)). No lo uses para nada más.
- **Pureza en el render:** nada de `Date.now()`, `Math.random()` ni lecturas de `window` durante el render de un componente. Se hacen en efectos o en handlers (lo exige el React Compiler).
- **Stores globales (zustand):** solo en islas cliente. En un Server Component, un store global se compartiría entre usuarios.

## 3. Nombres

### 3.1 Archivos

| Rol | Nombre | Ejemplo |
|---|---|---|
| Componente React | `PascalCase.tsx` | `UsersView.tsx`, `LoginForm.tsx` |
| Hook de un módulo | `use-<algo>.ts` en `hooks/` | `use-login.ts` |
| Tipos públicos del módulo | `types.ts` | `modules/users/types.ts` |
| Schemas de zod | `schemas.ts` | `modules/auth/schemas.ts` |
| Llamadas del navegador al BFF | `api.ts` | `modules/auth/api.ts` |
| Tipos de api-core | `server/contracts.ts` | re-exporta de `@zaku/shared-types` |
| Service | `server/<m>.service.ts` | `users.service.ts` |
| Mock | `server/<m>.mock.ts` | `users.mock.ts` |
| Mappers | `server/<m>.mappers.ts` | `users.mappers.ts` |
| Endpoints del BFF y loaders | `server/<m>.bff.ts` | `auth.bff.ts` |
| Otras piezas de servidor | `server/<kebab-case>.ts` | `remembered-tenant.ts` |
| Ruta de Next | los nombres que exige Next (`page.tsx`, `route.ts`…) | `app/(private)/users/page.tsx` |
| Test unitario | `.spec.ts` / `.spec.tsx`, en la ruta espejo de `test/unit/` | `test/unit/modules/users/server/users.mock.spec.ts` |
| Helper de tests | `test/support/<kebab-case>.ts` | `fake-session.ts` |

### 3.2 Código

Además de las [reglas generales de nombres](../../../docs/CLEAN_CODE.md#4-nombres):

- **Services:** clase `<M>Service` con métodos `static async`, uno por endpoint de api-core (`UsersService.listPage`).
- **Mocks:** objeto `<m>Mock` con un método por operación (`usersMock.listPage`). La etiqueta de `mock()` sigue el formato `'<Api>.<controller>.<acción>'` (`'Core.users.list'`).
- **Loaders y handlers del BFF:** verbo + recurso. Un loader de página empieza por `load` (`loadUsersPage`); un handler HTTP se nombra por la acción (`login`, `logout`).
- **Códigos de error propios:** `UPPER_SNAKE_CASE` (`UNAUTHENTICATED`, `VALIDATION`, `FORBIDDEN_ORIGIN`, `UPSTREAM_TIMEOUT`). Los errores de api-core conservan su `code` original.
- **Textos de la interfaz** en español; identificadores, tests y logs en inglés.

## 4. Imports

- **Entre capas o módulos:** alias `@/` (`@/shared/ui/Card`, `@/modules/auth/server/auth.bff`).
- **Dentro del mismo módulo:** imports relativos (`../schemas`, `./users.mappers`).
- **El `server/` de otro módulo no se importa nunca.** Solo `app/` y `layout/` pueden importar el `server/` de un módulo.
- **Tests:** importan `src/` solo con `@/`, y sus helpers con `@test/`.
- **Tipos de `@zaku/shared-types`:** siempre con `import type`. Los contratos de api-core que usa el `server/` de un módulo se re-exportan en su `server/contracts.ts`; los tipos públicos (`types.ts`) pueden importar directamente tipos neutros como `PaginationMeta`.
- **Sin barrels**, salvo `shared/server/http/index.ts`.

## 5. Errores

- La capa HTTP y los services **no lanzan excepciones** para errores esperados: devuelven `Result<T>`, con `ok()` y `fail(status, message, code)`.
- Un `ErrorModel` lleva `status`, `code`, un `message` apto para el usuario y, si aplica, `fields` (errores por campo).
- Los mensajes de los mocks y de web-core están en español. Los errores 5xx nunca llegan con detalle al navegador: los oculta `define-bff.ts`.
- `throw` se reserva para errores de programación o invariantes imposibles. Si escapa en un endpoint, el BFF responde 500 `INTERNAL`; si escapa en una página, se muestra `error.tsx`.
- `notFound()` y `redirect()` de Next sí se usan en páginas (lanzan internamente por diseño de Next).

## 6. Diseño

Además de los [principios generales de diseño](../../../docs/CLEAN_CODE.md#5-diseño):

- **Las páginas solo componen:** `requireUser()` (si es privada), validan parámetros, llaman a un loader del `.bff.ts` y pasan el resultado a un componente.
- **Los componentes reciben datos ya mapeados** (`types.ts`), nunca el contrato de api-core.
- **El tenant y el token salen de la sesión**, nunca del navegador ni de la URL.
- **A un Client Component solo se le pasan datos que el usuario puede ver.**
- **Un endpoint externo nuevo** se registra primero en `shared/server/http/apis.ts`.

## 7. Tests

Las [reglas generales de tests](../../../docs/CLEAN_CODE.md#6-tests) aplican completas: todo en `test/`, `test/unit/` como espejo de `src/`.

```text
src/modules/users/server/users.mock.ts  →  test/unit/modules/users/server/users.mock.spec.ts
src/modules/users/components/UsersView.tsx  →  test/unit/modules/users/components/UsersView.spec.tsx
```

### 7.1 Qué verifican los architecture tests

Esta es la lista completa; los demás documentos enlazan aquí.

`test/architecture/dependency-rules.spec.ts` revisa `src/`:

- las dependencias solo bajan: `app → layout → modules → shared`;
- el `server/` de un módulo no lo importa ningún otro módulo;
- todo archivo dentro de una carpeta `server/` empieza con `import 'server-only'` (salvo los que son una sola línea `export type { … } from '…';`);
- solo `shared/server/env.ts` lee `process.env`;
- cada método de un `*.service.ts` tiene las dos ramas, `return mock(` y `return http.`;
- cada `app/api/**/route.ts` es solo un re-export de una línea de un handler de `modules/<m>/server/<m>.bff.ts`;
- `app/` solo contiene archivos de rutas de Next (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`, `route.ts`, `globals.css`, `icon.svg`, `favicon.ico`).

`test/architecture/test-layout.spec.ts` revisa dónde viven los tests:

- no hay archivos de test en `src/`;
- cada archivo de test está en la carpeta cuyo proyecto de Jest lo ejecuta, y los helpers solo viven en `test/support/` o `test/setup/`;
- cada spec de `test/unit/` tiene su archivo en `src/` con la misma ruta (respetando mayúsculas y minúsculas) y lo importa;
- los tests importan `src/` solo con el alias `@/`.

`scripts/check-boundaries.mjs` (no es un test, pero corre en `pnpm lint`) revisa que el código de navegador no cruce a servidor ([ARCHITECTURE §5](./ARCHITECTURE.md#5-separación-cliente--servidor)).

### 7.2 Qué se prueba y dónde

| Qué | Dónde | Cómo |
|---|---|---|
| Schemas, mappers, mocks y utilidades | `test/unit/**`, en la ruta espejo | Funciones puras. |
| Services | `test/unit/modules/<m>/server/<m>.service.spec.ts` | La rama activa (el mock) con un `ServiceContext` de `test/support/service-context.fixture.ts`. |
| Cliente HTTP hacia api-core | `test/unit/shared/server/http/http-request.spec.ts` | `fetch` simulado con los envelopes de `test/support/api-core-responses.ts`. Es el test que cubre la rama REAL. |
| Endpoints del BFF y loaders | `test/unit/modules/<m>/server/<m>.bff.spec.ts` | `Request` reales y la sesión falsa de `test/support/fake-session.ts`. |
| `define-bff`, sesión y proxy | `test/unit/shared/server/**`, `test/unit/proxy.spec.ts` | Con `iron-session` y `next/headers` simulados. |
| Componentes y hooks | `test/unit/modules/<m>/components/*.spec.tsx`, `hooks/*.spec.tsx` | Testing Library en jsdom. |
| Reglas de arquitectura | `test/architecture/` | §7.1. |

### 7.3 Reglas propias de web-core

- **Entorno de Jest:** `node` por defecto. Un test de componentes o hooks declara jsdom en su primera línea:

  ```ts
  /** @jest-environment jsdom */
  ```

- **`server-only`** se sustituye en Jest por `test/support/empty-module.ts`, para poder probar el código de servidor.
- **`iron-session`** solo publica ESM y Jest corre en CommonJS: los tests que dependen de él lo simulan con `jest.mock('iron-session', …)`.
- **Logs de los mocks:** `mock()` escribe en el log; los tests que pasan por un mock silencian `console.log` con `jest.spyOn`.
- **Variables de entorno de los tests:** las fija `test/setup/environment.setup.ts`. Para cambiar una en un test, usa `withEnvironment` de `test/support/environment.ts`.
- **Cobertura** (`pnpm test:cov`):
  - `src/shared/server/**`: 90% de líneas y 80% de ramas;
  - `src/modules/*/server/**` salvo los `*.service.ts`: 90% de líneas y 80% de ramas.

  Los services quedan fuera porque su rama REAL es inalcanzable mientras el mock está activo. Esa rama la cubre el test del cliente HTTP.

## 8. Checklist antes de abrir un PR

Además del [checklist general](../../../docs/CLEAN_CODE.md#8-checklist-antes-de-abrir-un-pr):

- [ ] `pnpm --filter web-core test:cov` en verde (hoy no corre en CI).
- [ ] Si tocaste un service: `pnpm --filter web-core services:status` muestra el modo esperado.
- [ ] Si tocaste un endpoint del BFF: probado con `curl` (sin sesión → 401, body inválido → 400, otro origen → 403).
- [ ] Si añadiste UI:
  - solo tokens del tema;
  - funciona en móvil y en escritorio;
  - estados de carga, error y vacío.
- [ ] `'use client'` solo donde hace falta, y ninguna prop sensible hacia el navegador.
- [ ] Variables nuevas en `env.ts` y en `.env.example`.
