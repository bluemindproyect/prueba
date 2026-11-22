import type { Metadata } from 'next';
import Game from '@/features/a-sus-espaldas/components/Game';

export const metadata: Metadata = { title: 'A Sus Espaldas' };

export default function Page() {
  return <Game />;
}
