import { DEFAULT_ROUTE } from '@/shared/constants';
import { ButtonLink } from '@/shared/ui/ButtonLink';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-extrabold gradient-text">404</p>
        <h1 className="mt-3 text-xl font-bold text-ink">No encontramos esta página</h1>
        <ButtonLink href={DEFAULT_ROUTE} className="mt-6">
          Volver al inicio
        </ButtonLink>
      </div>
    </main>
  );
}
