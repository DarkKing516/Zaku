# AI_RULES

Reglas obligatorias para los agentes de IA (Claude, Cursor, Copilot…) que modifiquen cualquier parte de este monorepo. Son la versión condensada y ejecutable de los documentos de [docs/](./README.md); si hay dudas, mandan esos documentos.

## 1. Qué leer antes de tocar código

1. Este archivo.
2. Las reglas de la app que vas a tocar. Si el cambio toca dos apps, se cumplen las dos:
   - [apps/api-core/docs/AI_RULES.md](../apps/api-core/docs/AI_RULES.md)
   - [apps/web-core/docs/AI_RULES.md](../apps/web-core/docs/AI_RULES.md)
3. La sección relevante de la documentación:
   - si es de una app, en su `docs/`;
   - si afecta a todo el sistema, en este mismo `docs/`:
     - [ARCHITECTURE.md](./ARCHITECTURE.md)
     - [CLEAN_CODE.md](./CLEAN_CODE.md)
     - [DATABASE.md](./DATABASE.md)
     - [DEVELOPMENT.md](./DEVELOPMENT.md)

Paquetes compartidos:

- **`packages/database-lib`:** sigue las reglas de api-core y el [DATABASE.md](./DATABASE.md) general.
- **`packages/shared-types`:** sigue el [contrato HTTP entre apps](./ARCHITECTURE.md#4-contrato-http-entre-apps).

## 2. MUST

- **Arquitectura:** respeta la arquitectura de la app y copia la estructura de un módulo existente antes de inventar una nueva.
- **Tests:**
  - tests unitarios para cada cambio de comportamiento, siempre en la carpeta `test/` del workspace y, los unitarios, en la ruta espejo de `src/` dentro de `test/unit/`;
  - si mueves o renombras un archivo de `src/`, mueve su spec.
- **Contrato HTTP:** un cambio en el contrato entre apps toca `packages/shared-types`, el productor (api-core) y el consumidor (web-core) en el mismo cambio.
- **Variables de entorno:** las nuevas se añaden al lector validado de la app y a su `.env.example`.
- **Docs:** actualiza la documentación afectada en su lugar ([dónde va cada documento](./README.md#5-dónde-va-cada-documento)):
  - lo que solo describe una app va en `apps/<app>/docs/` y se enlaza desde el `README.md` de esa carpeta;
  - lo que afecta al sistema completo va en `docs/`.
- **Antes de terminar:** `pnpm run ci` en verde, más las verificaciones propias de la app.

## 3. MUST NOT

- **Código prohibido:**
  - `any`;
  - `console.*` en `src/`;
  - `process.env` fuera del lector de entorno de cada app.

  Excepciones: los scripts CLI (`apps/*/scripts/` y `packages/database-lib/src/scripts/`) y el setup de los tests (`test/setup/`, `test/support/`) pueden leer `process.env`; los scripts CLI también pueden usar `console`. Fuera de ellos, el logger de web-core (`shared/server/logger.ts`) es el único archivo de un `src/` que escribe en `console`.
- **Comentarios:** nada de comentarios que expliquen lo obvio, docstrings de relleno ni bloques de comentarios. Solo comentarios de una línea para restricciones no obvias, deuda intencional o decisiones no estándar.
- **Tests en `src/`:** ningún archivo de test dentro de un `src/`, en ningún workspace.
- **Tests y reglas:** no debilites tests, umbrales de cobertura ni reglas de `test/architecture` para que algo pase.
- **Dependencias entre workspaces:** ninguna app importa código de otra app; se comunican por HTTP y comparten solo `packages/*`.
- **Secretos:**
  - nunca en un archivo versionado;
  - nunca en variables `NEXT_PUBLIC_*`;
  - no edites el `.env.local` de un desarrollador.
- **Git:** no hagas `commit` ni `push` salvo que te lo pidan.

## 4. Checklist de entrega

- [ ] Reglas de la app tocada cumplidas (su `AI_RULES.md`).
- [ ] Tests nuevos en `test/`, en verde.
- [ ] `pnpm run ci` en verde.
- [ ] Docs actualizadas en el lugar correcto.
- [ ] Commit (solo si te lo piden) convencional, conciso y en inglés (ej. `feat(projects): add project creation`). Formato completo en [CLEAN_CODE §7](./CLEAN_CODE.md#7-commits).

## 5. Estilo de respuesta del agente

- Minimalista: indica qué se hizo y cómo se verificó, sin explicar el código salvo que te lo pidan.
- Si una regla de este documento impide lo que te piden, dilo explícitamente en lugar de saltártela.
