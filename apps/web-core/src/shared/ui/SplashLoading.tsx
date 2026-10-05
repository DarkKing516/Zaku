import { LoaderCircle } from 'lucide-react';

export function SplashLoading() {
  return (
    <div role="status" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div aria-hidden className="absolute -left-32 -top-32 size-96 animate-float rounded-full bg-primary-100/60 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 -right-32 size-80 animate-float-reverse rounded-full bg-secondary-100/40 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="grid size-20 place-items-center rounded-3xl text-white shadow-glow gradient-primary">
            <LoaderCircle className="size-10 animate-spin" aria-hidden />
          </div>
          <div aria-hidden className="absolute -inset-3 animate-spin-slow rounded-[2rem] border-2 border-primary-200" />
          <div aria-hidden className="absolute -inset-6 animate-spin-reverse-slow rounded-[2.5rem] border border-primary-100" />
        </div>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-muted">Cargando...</p>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-soft">
          <div className="h-full w-1/2 animate-progress rounded-full gradient-primary" />
        </div>
      </div>
    </div>
  );
}
