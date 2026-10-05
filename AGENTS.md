# Zaku · guía para agentes

Monorepo pnpm + Turborepo de una plataforma multi-tenant. Contiene:

- `apps/api-core` (NestJS);
- `apps/web-core` (Next.js 16);
- `packages/shared-types` y `packages/database-lib`.

- **Reglas obligatorias:** [docs/AI_RULES.md](docs/AI_RULES.md), más las de la app que vayas a tocar:
  - [api-core](apps/api-core/docs/AI_RULES.md)
  - [web-core](apps/web-core/docs/AI_RULES.md)
- **Índice de la documentación:** [docs/README.md](docs/README.md). Lo general del monorepo está en `docs/`; lo de cada app, en `apps/<app>/docs/`.
- **Verificación antes de terminar:** `pnpm run ci` desde la raíz, más las verificaciones propias de la app.
- Responde y documenta en español; los identificadores del código van en inglés. No hagas `commit` ni `push` salvo que te lo pidan.
