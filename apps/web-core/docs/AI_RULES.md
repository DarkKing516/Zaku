# AI_RULES · web-core

Reglas obligatorias para los agentes de IA (Claude, Cursor, Copilot…) que modifiquen `apps/web-core`. Se suman a las [reglas generales para agentes](../../../docs/AI_RULES.md), que también son obligatorias.

Son la versión condensada y ejecutable de [ARCHITECTURE.md](./ARCHITECTURE.md), [CLEAN_CODE.md](./CLEAN_CODE.md) y [DEVELOPMENT.md](./DEVELOPMENT.md). Si hay dudas, mandan esos documentos. [ONBOARDING.md](./ONBOARDING.md) tiene un ejemplo completo y verificado de una página nueva.

## 1. Antes de escribir código

1. **Next.js 16 difiere de lo que sueles conocer.** Lee la guía correspondiente en `node_modules/next/dist/docs/` antes de usar una API de Next:
   - `proxy.ts` reemplaza a `middleware.ts`;
   - `cookies()`, `headers()`, `params` y `searchParams` son asíncronos;
   - `next lint` ya no existe.
2. Copia la estructura de un módulo existente: `modules/users` (página con datos del servidor) o `modules/auth` (formulario con isla cliente y endpoint del BFF).
3. Decide la ubicación:
   1. ¿Es una ruta? → un `page.tsx` o un `route.ts` en `src/app/`, que solo compone.
   2. ¿Es de una feature? → `src/modules/<m>/`. Si habla con api-core o usa la sesión, va en su `server/`.
   3. ¿Es el marco de la app? → `src/layout/`.
   4. ¿Es común y sin negocio? → `src/shared/` (`server/`, `client/`, `ui/` o `utils/`).
4. No crees carpetas, capas, providers ni dependencias nuevas sin una necesidad concreta y presente.

## 2. MUST

- **Server Components por defecto.** `'use client'` solo para estado, efectos o eventos del navegador, en el componente más pequeño posible.
- **El navegador solo llama a `/api/*`**, y siempre con `apiClient`.
- **Todo endpoint `/api/*`:**
  - se declara en `modules/<m>/server/<m>.bff.ts` con `privateBff` (sesión obligatoria) o `publicBff`;
  - valida `body` y `query` con zod;
  - tiene un `route.ts` que es un re-export de una línea.
- **Toda página privada** llama a `requireUser()`, aunque su layout ya lo haga.
- **Todo archivo de una carpeta `server/`** empieza con `import 'server-only'`, salvo los que solo re-exportan tipos.
- **Todo método de un service** tiene las dos ramas, `return mock(...)` y `return http.…(...)`. Un endpoint nuevo de api-core se registra primero en `shared/server/http/apis.ts`.
- **El tenant y el token** salen de la sesión (`ServiceContext`), nunca del navegador.
- **Variables de entorno:** solo en `shared/server/env.ts` (schema de zod) y documentadas en `.env.example`.
- **UI:**
  - solo las clases de los tokens de `shared/ui/theme.css`;
  - componentes de `shared/ui/` antes que crear otros;
  - iconos de `lucide-react`;
  - textos en español.
- **Tests:** en `test/unit/`, en la ruta espejo del archivo de `src/`, importando con `@/`. Los tests de componentes y hooks empiezan con `/** @jest-environment jsdom */`.
- **Antes de terminar**, deben pasar:
  - `pnpm run ci` desde la raíz;
  - `pnpm --filter web-core lint`
  - `pnpm --filter web-core typecheck`
  - `pnpm --filter web-core test:cov`
  - `pnpm --filter web-core build`
  - si tocaste un service: `pnpm --filter web-core services:status`.

## 3. MUST NOT

- **Archivos dentro de `src/app/`** que no sean de rutas de Next: nada de componentes, hooks, providers ni `use-cases`.
- **Llamadas a api-core** (o a cualquier URL absoluta) desde el navegador.
- **Importar el `server/` de otro módulo**, ni importar `server/` desde código de navegador.
- **Variables `NEXT_PUBLIC_*`**, ni devolver al navegador el `accessToken`, URLs internas o cuerpos crudos de error.
- **Borrar una de las dos ramas** de un service, ni cambiar `allowUnreachableCode`.
- **Stores globales (zustand) en Server Components:** se compartirían entre usuarios.
- **`router.push` tras login o logout:** usa `useAppNavigation().goTo()`.
- **Editar `.env.local`** (es del desarrollador) **ni poner secretos** en las plantillas `.env.dev`, `.env.qa`, `.env.certification` o `.env.production`.

## 4. Checklist de entrega

- [ ] Ubicación correcta según las capas `app → layout → modules → shared`.
- [ ] Archivos con su nombre de rol (`.service.ts`, `.mock.ts`, `.mappers.ts`, `.bff.ts`, `schemas.ts`, `types.ts`).
- [ ] Endpoints probados con `curl`: sin sesión → 401, body inválido → 400, otro origen → 403.
- [ ] Tests nuevos en verde y cobertura dentro del umbral.
- [ ] Docs de web-core actualizadas (variables, endpoints del BFF, reglas).
- [ ] El [checklist general](../../../docs/AI_RULES.md#4-checklist-de-entrega) también está completo.
