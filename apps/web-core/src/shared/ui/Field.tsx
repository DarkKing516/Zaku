import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../utils/cn';

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
  readonly icon?: ReactNode;
}

export function TextField({ label, error, hint, icon, className, ...props }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="ml-1 block cursor-pointer text-[0.7rem] font-bold uppercase tracking-wider text-muted">
        {label}
      </label>
      <div
        className={cn(
          'group/input relative flex items-center rounded-control border bg-soft p-4 transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-400/20',
          error ? 'border-danger' : 'border-line',
        )}
      >
        {icon && <span className="mr-3 text-muted transition-colors group-focus-within/input:text-primary-500">{icon}</span>}
        <input
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn('w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70 disabled:cursor-not-allowed', className)}
          {...props}
        />
      </div>
      {error ? (
        <p id={messageId} role="alert" className="ml-1 text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="ml-1 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
