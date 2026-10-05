import { CircleAlert, Inbox, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export function ErrorState({ title = 'No pudimos cargar la información', message, action, className }: { title?: string; message: string; action?: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, className }: { title: string; description?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-tertiary-50 text-tertiary-600">
        <Inbox className="size-6" aria-hidden />
      </span>
      <div>
        <p className="font-medium text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
    </div>
  );
}

export function InlineAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-control bg-danger-soft px-3.5 py-3 text-sm text-danger">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
