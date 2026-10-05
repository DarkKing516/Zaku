import { CircleCheck, House, LayoutGrid, Users, type LucideIcon } from 'lucide-react';
import { APP_DESCRIPTION } from '@/shared/constants';
import { PageHeader } from '@/shared/ui/PageHeader';
import { cn } from '@/shared/utils/cn';

interface Stat {
  readonly label: string;
  readonly value: string;
  readonly icon: LucideIcon;
  readonly tone: { readonly glow: string; readonly badge: string };
}

const STATS: readonly Stat[] = [
  { label: 'Usuarios', value: '—', icon: Users, tone: { glow: 'bg-primary-100/40', badge: 'bg-primary-50 text-primary-600' } },
  { label: 'Módulos', value: '—', icon: LayoutGrid, tone: { glow: 'bg-secondary-100/40', badge: 'bg-secondary-50 text-secondary-600' } },
  { label: 'Estado', value: 'Activo', icon: CircleCheck, tone: { glow: 'bg-tertiary-100/40', badge: 'bg-tertiary-50 text-tertiary-600' } },
];

export function HomeView() {
  return (
    <div className="space-y-8">
      <PageHeader title="Bienvenido a Zaku" description={APP_DESCRIPTION} icon={<House className="size-7" aria-hidden />} />

      <section aria-label="Indicadores" className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-line/60 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
            <div aria-hidden className={cn('absolute -right-6 -top-6 size-20 rounded-full blur-xl transition-transform group-hover:scale-125', stat.tone.glow)} />
            <div className="relative z-10">
              <div className={cn('mb-3 grid size-10 place-items-center rounded-xl', stat.tone.badge)}>
                <stat.icon className="size-5" aria-hidden />
              </div>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
