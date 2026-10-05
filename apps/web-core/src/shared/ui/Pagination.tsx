import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly hrefFor: (page: number) => string;
}

const linkClasses = 'inline-flex h-10 cursor-pointer items-center gap-1 rounded-control px-4 text-sm font-bold text-primary-600 transition-colors hover:bg-primary-50';
const disabledClasses = 'inline-flex h-10 cursor-not-allowed items-center gap-1 rounded-control px-4 text-sm font-bold text-muted/60';

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      {hasPrevious ? (
        <Link href={hrefFor(page - 1)} className={linkClasses}>
          <ChevronLeft className="size-4" aria-hidden /> Anterior
        </Link>
      ) : (
        <span className={disabledClasses} aria-disabled>
          <ChevronLeft className="size-4" aria-hidden /> Anterior
        </span>
      )}
      <p className="text-sm text-muted">
        Página <span className="font-bold text-ink">{page}</span> de {totalPages}
      </p>
      {hasNext ? (
        <Link href={hrefFor(page + 1)} className={linkClasses}>
          Siguiente <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={disabledClasses} aria-disabled>
          Siguiente <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
