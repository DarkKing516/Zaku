# AI_RULES

- No introducir `any`.
- Mantener tenant isolation en cualquier query o acceso de recursos.
- Mantener el API envelope `{ success, data, error }`.
- No habilitar `synchronize: true`.
- Agregar/actualizar pruebas de aislamiento de tenant para cambios de datos.
