# @zaku/shared-types

Tipos del contrato HTTP entre las apps de Zaku. api-core lo produce (sus DTOs implementan estas interfaces) y web-core lo consume desde su servidor.

Reglas y flujo completo: [docs/ARCHITECTURE.md §4](../../docs/ARCHITECTURE.md#4-contrato-http-entre-apps).

## Contenido (`src/index.ts`)

| Tipo | Qué describe |
|---|---|
| `ApiSuccessResponse<T>`, `ApiErrorResponse`, `ApiResponse<T>` | Envelope estándar de las respuestas de api-core. |
| `ApiResponseMeta`, `PaginationMeta`, `ApiErrorBody`, `ApiErrorDetail` | Metadatos, paginación y detalle de errores del envelope. |
| `CreateTenantRequest`, `TenantResponse`, `TenantStatus` | Tenants. |
| `CreateUserRequest`, `UserResponse` | Usuarios. |
| `LoginRequest`, `LoginResponse` | Login. |

## Reglas

- **Solo tipos:** nada de código ejecutable. Se importa con `import type`.
- **Un cambio aquí** se acompaña, en el mismo PR, del cambio en api-core y en web-core.
- **Después de editarlo**, compila el paquete (`pnpm --filter @zaku/shared-types build`, o `pnpm build` en la raíz) para que las apps vean los tipos nuevos.
