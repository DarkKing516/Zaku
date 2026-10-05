'use client';

import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from 'lucide-react';
import { useToastStore, type ToastKind } from '../client/toast';
import { cn } from '../utils/cn';

const styles: Record<ToastKind, { icon: LucideIcon; classes: string }> = {
  success: { icon: CircleCheck, classes: 'text-success' },
  error: { icon: CircleAlert, classes: 'text-danger' },
  info: { icon: Info, classes: 'text-primary-600' },
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((toast) => {
        const { icon: Icon, classes } = styles[toast.kind];
        return (
          <div key={toast.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-control border border-line bg-surface p-4 shadow-premium">
            <Icon className={cn('mt-0.5 size-5 shrink-0', classes)} aria-hidden />
            <p className="flex-1 text-sm text-ink">{toast.message}</p>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Cerrar notificación" className="cursor-pointer text-muted hover:text-ink">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
