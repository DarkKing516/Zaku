# DEVELOPMENT

## Quick start
1. `corepack enable && corepack prepare pnpm@9.1.0 --activate`
2. `pnpm install`
3. `pnpm infra:up`
4. `pnpm db:migration:run`
5. `pnpm dev`

## Crear módulo backend
- Crear `module`, `service`, `controller`.
- Definir DTOs en archivos separados.
- Aplicar tenant checks en cada lectura/escritura.
