import type { ComponentProps } from 'react';
import { cn } from '../utils/cn';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('relative overflow-hidden rounded-card border border-black/[0.03] bg-surface shadow-soft', className)} {...props} />;
}
