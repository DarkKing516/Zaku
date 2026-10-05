import { ArrowRight, Sparkles } from 'lucide-react';
import { LOGIN_ROUTE } from '@/shared/constants';
import { ButtonLink } from '@/shared/ui/ButtonLink';

export function LandingView() {
  return (
    <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
      <div className="mb-8 grid size-20 place-items-center rounded-3xl text-white shadow-glow gradient-primary">
        <Sparkles className="size-10" aria-hidden />
      </div>

      <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-ink">
        Zaku <span className="gradient-text">Enterprise</span>
      </h1>

      <p className="mb-10 max-w-md text-lg leading-relaxed text-muted">
        Plataforma empresarial multi-tenant. Gestiona tu negocio con herramientas modernas y seguras.
      </p>

      <ButtonLink href={LOGIN_ROUTE} size="lg" className="hover:-translate-y-0.5 hover:shadow-xl">
        Comenzar <ArrowRight className="size-5" aria-hidden />
      </ButtonLink>
    </div>
  );
}
