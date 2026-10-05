# api-core · guía para agentes

API NestJS de Zaku: hexagonal + CQRS-lite, una base de datos por tenant, envelope de respuesta estándar, idempotencia y adapters conmutables a mocks.

- **Reglas obligatorias:** [docs/AI_RULES.md](docs/AI_RULES.md) de esta app y las [generales del monorepo](../../docs/AI_RULES.md).
- **Documentación de la app:** [docs/README.md](docs/README.md). Ejemplo completo de un endpoint nuevo: [docs/ONBOARDING.md §6](docs/ONBOARDING.md#6-tu-primer-endpoint-paso-a-paso).
- **Verificación antes de terminar:**
  - `pnpm run ci` desde la raíz;
  - si tocaste persistencia o Redis, además `pnpm --filter api-core test:integration` (necesita `pnpm infra:up`).
- Responde y documenta en español; los identificadores del código van en inglés. No hagas `commit` ni `push` salvo que te lo pidan.
