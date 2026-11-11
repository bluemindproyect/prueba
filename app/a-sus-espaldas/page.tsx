import type { Metadata } from 'next';
import Game from '@/components/a-sus-espaldas/Game';

export const metadata: Metadata = { title: 'A Sus Espaldas' };

export default function Page() {
  return <Game />;
}
