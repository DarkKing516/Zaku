import { getAppInfo } from '@/shared/server/app-info';

export function AppVersion({ className }: { className?: string }) {
  const { version, environment } = getAppInfo();
  return (
    <span className={className} title={environment ? `Ambiente: ${environment}` : undefined}>
      {environment ? `${environment} · ` : ''}V. {version}
    </span>
  );
}
