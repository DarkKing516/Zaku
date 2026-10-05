'use client';

import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/states';

export default function PrivateError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      message="Ocurrió un error inesperado al mostrar esta pantalla."
      action={
        <Button variant="ghost" size="sm" onClick={reset}>
          Reintentar
        </Button>
      }
    />
  );
}
