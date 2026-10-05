import { Sparkles } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('grid size-10 place-items-center rounded-xl text-white shadow-lg shadow-primary-500/30 gradient-primary', className)}>
      <Sparkles className="size-6" aria-hidden />
    </span>
  );
}
