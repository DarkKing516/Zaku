# api-core · documentación

API de negocio de Zaku: NestJS con arquitectura hexagonal + CQRS-lite, multi-tenant con una base de datos PostgreSQL por tenant, respuestas con un envelope estándar, idempotencia en Redis y adapters conmutables a mocks.

← [Volver al hub de documentación del monorepo](../../../docs/README.md)

## Por dónde empezar

1. [DEVELOPMENT.md general](../../../docs/DEVELOPMENT.md): instala y compila el monorepo.
2. [DEVELOPMENT.md](./DEVELOPMENT.md) de api-core: arráncala en modo mock (sin Docker) o en modo real.
3. [ONBOARDING.md](./ONBOARDING.md): sigue una request archivo por archivo y construye tu primer endpoint.
4. [ARCHITECTURE.md](./ARCHITECTURE.md) y [CLEAN_CODE.md](./CLEAN_CODE.md): las reglas formales, para consultar cuando las necesites.

## Documentos

| Documento | Para qué |
|---|---|
| [ONBOARDING.md](./ONBOARDING.md) | Primera lectura: cómo viaja una request archivo por archivo, cómo funcionan command, bus y handler, y cómo crear un endpoint paso a paso. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Capas, core vs common, CQRS, multi-tenancy, estándar de respuesta y catálogo de errores, idempotencia, mocks, seguridad, decisiones y riesgos. |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Puesta en marcha, variables de entorno, scripts, endpoints, guías paso a paso, tests y problemas frecuentes. |
| [CLEAN_CODE.md](./CLEAN_CODE.md) | Reglas de código propias de api-core: nombres de archivos, imports, errores, qué verifica el architecture test y cobertura. |
| [DATABASE.md](./DATABASE.md) | Conexiones y pools, aprovisionamiento de tenants, cómo añadir una tabla y tests contra Postgres. |
| [AI_RULES.md](./AI_RULES.md) | Reglas obligatorias para agentes de IA que modifiquen api-core. |
| [ASYNC_JOBS_PROPOSAL.md](./ASYNC_JOBS_PROPOSAL.md) | Propuesta (no implementada) de colas y jobs asíncronos con BullMQ. |

## Documentación general relacionada

- [ARCHITECTURE.md general](../../../docs/ARCHITECTURE.md): cómo se comunica api-core con web-core, el contrato HTTP compartido y el flujo de autenticación de punta a punta.
- [DATABASE.md general](../../../docs/DATABASE.md): estrategia de una DB por tenant, esquema, estados del tenant y migraciones.
- [CLEAN_CODE.md general](../../../docs/CLEAN_CODE.md): reglas comunes a todo el monorepo (anti-slop, TypeScript, tests, commits).

## Dónde va un documento nuevo de api-core

En esta carpeta, enlazado desde la tabla de arriba. Si describe algo que afecta a otras apps, va en [`docs/`](../../../docs/README.md#5-dónde-va-cada-documento).
