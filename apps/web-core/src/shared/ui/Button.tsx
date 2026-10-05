import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-70',
  ghost: 'bg-transparent text-muted hover:bg-soft hover:text-primary-600 disabled:opacity-60',
  danger: 'bg-transparent text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-60',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-sm',
  lg: 'h-14 px-8 text-base',
};

export function buttonClasses({ variant = 'primary', size = 'md', className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-control font-bold transition-all duration-300 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ComponentProps<'button'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
}

export function Button({ variant, size, loading, disabled, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses({ variant, size, className })} {...props}>
      {loading && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
