import type { Metadata } from 'next';
import Gestos from '@/features/a-sus-espaldas/components/mundo/Gestos';

export const metadata: Metadata = { title: 'Gestos · A Sus Espaldas' };

export default function Page() {
  return <Gestos />;
}
