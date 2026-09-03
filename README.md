# Zaku Enterprise Monorepo

Monorepo multi-tenant con pnpm + Turborepo + NestJS + Next.js + TypeORM.

## Requisitos
- Node 18.17.0+
- pnpm 9.1.0

## Estructura
- `apps/api-core`: API NestJS
- `apps/web-core`: Frontend Next.js
- `apps/mobile-app`: Placeholder
- `packages/shared-types`: tipos compartidos
- `packages/database-lib`: TypeORM, entities y migrations

## Comandos
- `pnpm install`
- `pnpm infra:up`
- `pnpm db:migration:run`
- `pnpm dev`
- `pnpm test`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
