# web-core · documentación

Frontend web de Zaku: Next.js 16 (App Router) y React 19, con páginas renderizadas en el servidor, un mini-BFF en `/api/*`, sesión cifrada con iron-session y services que alternan entre mocks y api-core método a método.

← [Volver al hub de documentación del monorepo](../../../docs/README.md)

## Por dónde empezar

1. [DEVELOPMENT.md general](../../../docs/DEVELOPMENT.md): instala y compila el monorepo.
2. [DEVELOPMENT.md](./DEVELOPMENT.md) de web-core: crea tu `.env.local` y arráncala (en modo mock no necesitas api-core).
3. [ONBOARDING.md](./ONBOARDING.md): sigue una página y el login archivo por archivo, y construye tu primera página.
4. [ARCHITECTURE.md](./ARCHITECTURE.md) y [CLEAN_CODE.md](./CLEAN_CODE.md): las reglas formales, para consultar cuando las necesites.

## Documentos

| Documento | Para qué |
|---|---|
| [ONBOARDING.md](./ONBOARDING.md) | Primera lectura: recorrido de una página y del login, los tres tipos de "usuario" y una página nueva paso a paso (ejemplo verificado). |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Capas, estructura de carpetas, anatomía de un módulo, separación cliente/servidor, mini-BFF, capa HTTP, switch mock ⇄ real, sesión, ambientes, UI, seguridad, decisiones y riesgos. |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Puesta en marcha, variables de entorno, cómo pasar a REAL, scripts, builds por ambiente, tests y problemas frecuentes. |
| [CLEAN_CODE.md](./CLEAN_CODE.md) | Reglas de código propias de web-core: nombres, imports, errores, qué verifican los architecture tests y cobertura. |
| [AI_RULES.md](./AI_RULES.md) | Reglas obligatorias para agentes de IA que modifiquen web-core. |

## Documentación general relacionada

- [ARCHITECTURE.md general](../../../docs/ARCHITECTURE.md): cómo se comunica web-core con api-core, el contrato HTTP compartido y la autenticación de punta a punta.
- [CLEAN_CODE.md general](../../../docs/CLEAN_CODE.md): reglas comunes a todo el monorepo (anti-slop, TypeScript, tests, commits).
- [api-core](../../api-core/docs/README.md): la API que consume web-core.

## Dónde va un documento nuevo de web-core

En esta carpeta, enlazado desde la tabla de arriba. Si describe algo que afecta a otras apps, va en [`docs/`](../../../docs/README.md#5-dónde-va-cada-documento).
