# DEVELOPMENT · web-core

Guía práctica para trabajar en `apps/web-core`. Si es tu primera vez, sigue después [ONBOARDING.md](./ONBOARDING.md).

## 1. Puesta en marcha

1. Si es tu primera vez en el monorepo, ejecuta antes `pnpm install` y `pnpm build` en la raíz ([primer arranque](../../../docs/DEVELOPMENT.md#2-primer-arranque)).

2. Crea `apps/web-core/.env.local` a partir de `.env.example`. Solo `SESSION_SECRET` es obligatoria (32 caracteres o más). Para generar una:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

   Deja `APP_ENV=local`: así `/login` muestra las credenciales de demo.

3. Arranca en modo desarrollo:

   ```bash
   pnpm --filter web-core dev
   ```

4. Abre `http://localhost:3001` (api-core usa el 3000). Inicia sesión con los datos de demo:

   | Campo | Valor |
   |---|---|
   | Organización (ID) | `00000000-0000-4000-8000-000000000001` |
   | Correo | `demo@zaku.dev` |
   | Contraseña | `demo-password` |

Por defecto todos los services están en **MOCK**: no necesitas api-core ni Docker.

## 2. Variables de entorno

Solo las lee `src/shared/server/env.ts`, que las valida con zod. El catálogo comentado está en `.env.example`.

| Variable | Defecto | Descripción |
|---|---|---|
| `APP_ENV` | — | `local`, `dev`, `cert`, `qa` o `prod`. Solo `local` muestra ayudas de prueba (credenciales demo en `/login`). Fuera de `prod`, el pie muestra el ambiente junto a la versión. |
| `SESSION_SECRET` | **obligatoria** | Clave de cifrado de la cookie de sesión. Mínimo 32 caracteres. |
| `SESSION_TTL_SECONDS` | `28800` (8 h) | Vida máxima de la cookie. La sesión vence antes si vence el token de api-core. |
| `SESSION_COOKIE_SECURE` | `Secure` solo en producción | `true` o `false`. Usa `false` si un ambiente corre con `NODE_ENV=production` sobre HTTP sin TLS. |
| `MOCK_LATENCY_MS` | `350` | Latencia simulada de los mocks. |
| `HTTP_TIMEOUT_MS` | `15000` | Timeout de las llamadas reales a api-core. |
| `API_CORE_URL` | — | URL base de api-core **con** el prefijo global, sin versión: `http://localhost:3000/api`. Solo hace falta si algún service está en REAL. |

Ninguna variable usa `NEXT_PUBLIC_`: ninguna llega al navegador.

## 3. Mock o real

Cada método de un `*.service.ts` elige su modo con la línea `return mock(...)` ([ARCHITECTURE §8](./ARCHITECTURE.md#8-switch-mock--real)).

Para ver el modo de cada método:

```bash
pnpm --filter web-core services:status
```

**Pasar un método a REAL contra una api-core local:**

1. Arranca api-core. Sin Docker, en modo mock con los datos de demo ([api-core §2.2](../../api-core/docs/DEVELOPMENT.md#22-modo-mock-sin-docker)). Así el mismo tenant y el mismo usuario existen en las dos apps.
2. En `.env.local`: `API_CORE_URL=http://localhost:3000/api`.
3. Comenta la línea `return mock(...)` del método. Para un flujo completo, pasa a REAL `AuthService.login` y los métodos de `UsersService` a la vez: el token que emite el mock de web-core no es un JWT válido para api-core.
4. Reinicia `pnpm --filter web-core dev` y entra con los datos de demo.

Para volver a MOCK, descomenta la línea. Antes de desplegar, `services:status --require-real` falla si queda algún método en MOCK.

## 4. Scripts

`pnpm --filter web-core <script>`, o `pnpm <script>` dentro de `apps/web-core`:

| Script | Qué hace |
|---|---|
| `dev` | `next dev` en el puerto 3001. |
| `build` / `start` | Build y arranque de producción con las variables del entorno actual. `start` usa el puerto 3000 de Next (el de api-core): pásale `--port 3001` si corren juntas. |
| `build:<ambiente>` / `start:<ambiente>` | Igual, cargando antes `.env.dev`, `.env.qa`, `.env.certification` o `.env.production` (`<ambiente>` = `dev`, `qa`, `cer` o `production`). §5. |
| `lint` | ESLint y la frontera cliente/servidor (`check:boundaries`). |
| `typecheck` | `next typegen` (tipos de rutas) y `tsc --noEmit`. |
| `test` | Tests unitarios y de arquitectura. |
| `test:cov` | Lo mismo, con los umbrales de cobertura. |
| `check:boundaries` | Solo la verificación de la frontera cliente/servidor. |
| `services:status` | Modo (MOCK o REAL) de cada método de los services. Con `--require-real`, falla si queda alguno en MOCK. |

## 5. Ambientes y builds

- Las plantillas `.env.dev`, `.env.qa`, `.env.certification` y `.env.production` **se versionan sin secretos**.
- `scripts/with-env.mjs` carga la plantilla del ambiente y luego ejecuta `next build` o `next start`. No sobrescribe variables ya definidas, así que el pipeline inyecta `SESSION_SECRET` (y lo que haga falta) como variable de entorno.
- `.env.local` es solo de tu máquina y no debe versionarse (está en `.gitignore`).
- **Imagen Docker:** `NEXT_STANDALONE=true pnpm --filter web-core build` genera la salida `standalone` de Next.

Detalle de cada ambiente en [ARCHITECTURE §10](./ARCHITECTURE.md#10-ambientes).

## 6. Tests

```bash
pnpm --filter web-core test
```

```bash
pnpm --filter web-core test:cov
```

- Todos los tests están en `test/`, y `test/unit/` es espejo de `src/`. Reglas y patrones en [CLEAN_CODE §7](./CLEAN_CODE.md#7-tests).
- **Configuración** (`jest.config.mjs`):
  - Jest 29 con `next/jest` (SWC);
  - entorno `node` por defecto;
  - aliases `@/` y `@test/`;
  - variables de prueba en `test/setup/environment.setup.ts`;
  - matchers del DOM (`toBeInTheDocument`…) en `test/setup/dom-matchers.setup.ts`.
- **Para probar en el navegador** lo que no cubre Jest (navegación, cookies, layout responsive): `pnpm --filter web-core build` y `pnpm --filter web-core start --port 3001`, y recorre login → inicio → usuarios → logout.

## 7. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `Invalid environment variables -> SESSION_SECRET: ...` | Falta `.env.local` o el secreto es corto. | §1, paso 2. |
| El login responde "El tenant no existe o no está disponible" | El ID de organización no es el del tenant demo. | Usa el de la tabla de §1. |
| La cookie de sesión no se guarda en un ambiente de pruebas | Corre con `NODE_ENV=production` sobre HTTP: la cookie es `Secure`. | `SESSION_COOKIE_SECURE=false` en ese ambiente, o servirlo con HTTPS. |
| "No fue posible contactar el servicio" (`502 UPSTREAM_UNREACHABLE`) | Un service está en REAL y api-core no responde. | Arranca api-core, revisa `API_CORE_URL` o vuelve el método a MOCK. |
| `500 API_NOT_CONFIGURED` en el log | Service en REAL con `API_CORE_URL` vacía. | Define `API_CORE_URL`. |
| `500 API_NOT_REGISTERED` en el log | El endpoint no está en `shared/server/http/apis.ts`. | Regístralo (controller, acción y versión). |
| En REAL, el usuario ve mensajes de error en inglés | El BFF reenvía el `message` de api-core. | Deuda conocida ([ARCHITECTURE §14](./ARCHITECTURE.md#14-riesgos-conocidos-y-deuda-técnica-intencional)). |
| El build falla al importar `server-only` desde un Client Component | Un componente `'use client'` importa algo de `server/`. | Pásale los datos como props desde el Server Component, o llama al BFF con `apiClient`. |
| `pnpm lint` falla con "client/server boundary violation" | Código de navegador importa código de servidor, lee variables de entorno o llama a una URL absoluta. | El mensaje indica el archivo y el import ([ARCHITECTURE §5](./ARCHITECTURE.md#5-separación-cliente--servidor)). |
| `SyntaxError: Unexpected token 'export'` en Jest | Una librería solo publica ESM. | Simúlala con `jest.mock(...)` en el test, como `iron-session`. |
| Tras el login o el logout, el menú muestra la sesión anterior | Se navegó con `router.push`: Next reutiliza su caché de rutas. | Navega con `useAppNavigation().goTo()`, que además refresca. |
| `EADDRINUSE` al arrancar | Otro proceso usa el puerto: un `next start` anterior que sigue vivo, o api-core en el 3000 si arrancaste `start` sin `--port`. | Detén ese proceso o usa `--port 3001`. |

Problemas comunes a todo el monorepo: [DEVELOPMENT general §6](../../../docs/DEVELOPMENT.md#6-problemas-frecuentes).
