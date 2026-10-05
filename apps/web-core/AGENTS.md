# web-core · guía para agentes

Frontend Next.js 16 de Zaku: Server Components, mini-BFF en `/api/*` y services con switch mock ⇄ real.

- **Reglas obligatorias:** [docs/AI_RULES.md](docs/AI_RULES.md) de esta app y las [generales del monorepo](../../docs/AI_RULES.md).
- **Documentación de la app:** [docs/README.md](docs/README.md). Ejemplo completo de una página nueva: [docs/ONBOARDING.md §6](docs/ONBOARDING.md#6-tu-primera-página-paso-a-paso).
- **Verificación antes de terminar:** `pnpm run ci` desde la raíz y, en esta carpeta, `pnpm test:cov` (la cobertura de web-core aún no corre en CI). Si tocaste un service, `pnpm services:status`.
- Responde y documenta en español; los identificadores del código van en inglés. No hagas `commit` ni `push` salvo que te lo pidan.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
