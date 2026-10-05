import type { ReactNode } from 'react';

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
}

export function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center gap-4">
      {icon && <div className="grid size-14 place-items-center rounded-2xl bg-primary-50 text-primary-600 shadow-sm">{icon}</div>}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
    </div>
  );
}
