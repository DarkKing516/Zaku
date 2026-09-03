# ARCHITECTURE

## Estrategia multi-tenant
- El `tenantId` viaja en JWT y contexto AsyncLocalStorage.
- El acceso a datos debe validar `tenant_id` en cada query.
- El backend usa envelope global de respuestas y filtro global de errores.

## Diagrama lógico
```text
Web Core (Next.js) -> API Core (NestJS)
                         |-- Auth (JWT)
                         |-- Users (tenant-aware)
                         |-- Queue/Cron
                         |-- TypeORM (database-lib)
PostgreSQL <-------------|
Redis <------------------|
```
