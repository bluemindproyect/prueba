import type { Metadata } from 'next';
import Mundo from '@/features/a-sus-espaldas/components/mundo/Mundo';

export const metadata: Metadata = { title: 'A Sus Espaldas · El mundo' };

export default function Page() {
  return <Mundo />;
}
