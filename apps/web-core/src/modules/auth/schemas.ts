import { z } from 'zod';

export const tenantIdSchema = z.string().trim().toLowerCase().pipe(z.uuid({ error: 'Ingresa un ID de organización válido' }));

export const loginSchema = z.object({
  tenantId: tenantIdSchema,
  email: z.string().trim().toLowerCase().pipe(z.email({ error: 'Ingresa un correo válido' }).max(254, 'Máximo 254 caracteres')),
  password: z.string().min(1, 'Ingresa tu contraseña').max(1024, 'Máximo 1024 caracteres'),
});

export type LoginInput = z.input<typeof loginSchema>;
