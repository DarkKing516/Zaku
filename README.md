# Zaku Enterprise Monorepo

Plataforma multi-tenant: pnpm + Turborepo, NestJS (hexagonal + CQRS-lite), Next.js 16 (Server Components + BFF), TypeORM/PostgreSQL y Redis.

**Toda la documentación empieza en [docs/README.md](docs/README.md)**: qué es cada app y cada paquete, por dónde empezar según tu rol y el enlace a la documentación propia de cada app.

## Inicio rápido

Requisitos: Node 22.12+ y pnpm 9.1 (Docker solo si trabajas con bases de datos reales).

```bash
pnpm install
```

```bash
pnpm build
```

```bash
pnpm dev
```

Antes de `pnpm dev`, cada app necesita su archivo de entorno (`apps/api-core/.env` y `apps/web-core/.env.local`). Los pasos, los modos (mock o real) y todos los comandos de la raíz están en [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

Antes de abrir un PR:

```bash
pnpm run ci
```
