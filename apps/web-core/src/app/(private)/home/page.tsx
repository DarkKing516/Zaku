import type { Metadata } from 'next';
import { HomeView } from '@/modules/home/components/HomeView';
import { requireUser } from '@/shared/server/session';

export const metadata: Metadata = { title: 'Inicio' };

export default async function HomePage() {
  await requireUser();

  return <HomeView />;
}
