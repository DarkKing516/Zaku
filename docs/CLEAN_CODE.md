# CLEAN_CODE

Reglas de código comunes a todo el monorepo (`apps/*` y `packages/*`). Aplican igual a personas y a agentes de IA.

Cada app añade sus reglas propias:

- [api-core](../apps/api-core/docs/CLEAN_CODE.md): NestJS, hexagonal + CQRS-lite, TypeORM, catálogo de errores.
- [web-core](../apps/web-core/docs/CLEAN_CODE.md): Next.js, separación cliente/servidor, BFF, Server Components.

## 1. Cómo se hacen cumplir

Las reglas no solo se documentan: cada app tiene herramientas que fallan si no se cumplen.

| Verificación | Dónde | Qué controla |
|---|---|---|
| TypeScript `strict` | todos los paquetes (`pnpm typecheck`) | Tipos. |
| ESLint con tipos | api-core y web-core (`pnpm lint`) | `no-explicit-any`, `no-floating-promises`, `no-console`, `eqeqeq` y el resto de las reglas *recommended type-checked*. |
| Architecture tests | `apps/<app>/test/architecture/` | Dependencias entre capas y ubicación de los tests. Cada app documenta su lista en su `CLEAN_CODE.md`. |
| Umbrales de cobertura | `test:cov` de cada app | Mínimos de cobertura. |
| Code review | PR | Todo lo demás. |

## 2. Directrices anti-slop

- **No** escribas comentarios explicativos, docstrings introductorios ni explicaciones de código evidente.
- El código se autodocumenta con nombres muy descriptivos de variables, funciones y clases.
- Comenta **solo**:
  - una excepción compleja o una restricción técnica no obvia (ej. "los identificadores no se pueden parametrizar en `CREATE DATABASE`");
  - deuda técnica **intencional**;
  - una decisión de arquitectura no estándar.

  Ese comentario ocupa una línea y explica el **por qué**, nunca el **qué**.
- Los commits siguen el formato convencional y son extremadamente concisos (§7).
- En la consola y en los PR, sé minimalista: no expliques el código generado salvo que te lo pidan.

```ts
// ❌ Prohibido
// Esta función crea un usuario. Recibe el email y la contraseña y los guarda.
async function create(e: string, p: string) { ... }

// ✅ Correcto
async function registerUserWithHashedPassword(email: Email, plainPassword: Secret): Promise<User> { ... }

// ✅ Comentario válido: explica una restricción no obvia
// Identifiers cannot be bound as parameters; databaseName is derived from a UUID and validated above.
```

## 3. TypeScript

- **Siempre `strict`. Prohibido `any`.** Los datos externos se tipan como `unknown` y se acotan con type guards o con un schema (zod en web-core, class-validator en api-core).
- **Ninguna promesa queda flotando.** Si se ignora a propósito, se marca con `void promise`.
- **`readonly` por defecto** en propiedades de interfaces, tipos de datos y objetos de valor.
- **Enums:** objeto `as const` más un tipo derivado, salvo que una librería exija un `enum`.
- **Operador de aserción no nula (`value!`):** prohibido.
- **Variables de entorno:** cada app las lee en **un solo archivo** que las valida al cargar (api-core: `core/config`; web-core: `shared/server/env.ts`). El resto del código recibe los valores ya tipados.
- **Logs:** nada de `console.*` en `src/`. Cada app tiene su logger (api-core: el `Logger` de Nest; web-core: `shared/server/logger.ts`, el único archivo de su `src/` que escribe en `console`).
- **Excepciones:** los scripts CLI (`apps/*/scripts/` y `packages/database-lib/src/scripts/`) y el setup de los tests (`test/setup/`, `test/support/`) pueden leer `process.env`; los scripts CLI también pueden usar `console`.

## 4. Nombres

- **Mayúsculas y minúsculas:**
  - clases, tipos y componentes React en `PascalCase`;
  - funciones y variables en `camelCase`;
  - constantes de módulo en `UPPER_SNAKE_CASE`.
- **Archivos:** `kebab-case` con un sufijo que indica su rol (`.service.ts`, `.handler.ts`…). Los componentes React se nombran como el componente (`LoginForm.tsx`). Las tablas de sufijos están en el `CLEAN_CODE.md` de cada app.
- **Idioma:** identificadores, tests y commits en **inglés**; documentación y textos de la interfaz en **español**.
- **Booleanos:** preferir prefijos `is/has/can` en funciones y variables locales (ej. `isTenantActive`).
- **Abreviaturas:** ninguna. Se escribe `tenantRepository`, no `tRepo`.

## 5. Diseño

- **Responsabilidades:** una clase, una función o un componente, una responsabilidad.
- **Inmutabilidad por defecto:** los datos que viajan entre capas son de solo lectura.
- **Abstracciones:** no se crean clases base, helpers ni abstracciones "por si acaso". Se extraen cuando hay al menos dos usos reales.
- **Funciones cortas:** si una función necesita un comentario para entenderse, se renombra o se divide.
- **Dependencias entre workspaces:** solo `app → package`, nunca `app → app` ([ARCHITECTURE §3](./ARCHITECTURE.md#3-reglas-de-dependencia-entre-workspaces)).

## 6. Tests

Los tests unitarios son **obligatorios** en cada implementación. Una tarea no está terminada si faltan.

- **Ningún test vive en un `src/`**, ni en las apps ni en `packages/*`. Todos están en la carpeta `test/` del workspace.
- **`test/unit/` es espejo de `src/`:** cada spec está en la ruta del archivo que prueba. No todo archivo necesita spec, pero todo spec corresponde a un archivo. Si mueves o renombras un archivo de `src/`, mueve su spec.
- **Helpers y fixtures** solo en `test/support/` y `test/setup/`.
- **Nombre del test:** el comportamiento esperado, en inglés (`it('rejects a slug that already belongs to an active tenant')`).
- **Estructura:** Arrange / Act / Assert, separados por líneas en blanco.
- **Fakes antes que mocks:** se prefieren implementaciones en memoria antes que `jest.fn()`.
- **Independencia:** los tests no dependen del orden de ejecución ni comparten estado mutable.
- **No se debilitan** tests, umbrales de cobertura ni reglas de arquitectura para que algo pase.

En api-core y web-core, el architecture test `test-layout.spec.ts` comprueba estas reglas de ubicación. El porqué de esta decisión está en [ARCHITECTURE §8](./ARCHITECTURE.md#8-decisiones-transversales-adr-resumido).

## 7. Commits

Formato [Conventional Commits](https://www.conventionalcommits.org/): en inglés, en minúscula, en imperativo y en una línea.

```text
<tipo>(<alcance opcional>): <descripción corta>
```

| Tipo | Uso | Ejemplo |
|---|---|---|
| `feat` | funcionalidad nueva | `feat(tenants): add tenant provisioning retry` |
| `fix` | corrección | `fix(user-auth): reject tokens without exp` |
| `refactor` | cambio interno sin cambio de comportamiento | `refactor(core): move tenancy guard to core` |
| `test` | solo tests | `test(users): cover credential timing path` |
| `docs` | documentación | `docs: describe idempotency flow` |
| `chore` / `build` / `ci` | herramientas, dependencias, pipelines | `ci: run on node 22` |

El alcance suele ser la app o el módulo (`web-core`, `tenants`, `database-lib`…). Un commit equivale a un cambio coherente. Nada de `wip`, `fix stuff` ni mensajes de varios párrafos.

## 8. Checklist antes de abrir un PR

- [ ] `pnpm run ci` en verde ([DEVELOPMENT §3](./DEVELOPMENT.md#3-comandos-de-la-raíz)).
- [ ] Tests nuevos para cada cambio de comportamiento, en `test/` (nunca en `src/`).
- [ ] Sin comentarios superfluos, sin `any` y sin `console.*`.
- [ ] Docs actualizadas si cambió una regla, un contrato HTTP, un `code` de error o la estructura, en el lugar correcto ([dónde va cada documento](./README.md#5-dónde-va-cada-documento)).
- [ ] El checklist propio de la app que tocaste: [api-core](../apps/api-core/docs/CLEAN_CODE.md#8-checklist-antes-de-abrir-un-pr) · [web-core](../apps/web-core/docs/CLEAN_CODE.md#8-checklist-antes-de-abrir-un-pr).
