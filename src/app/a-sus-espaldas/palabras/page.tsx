import type { Metadata } from 'next';
import Palabras from '@/features/a-sus-espaldas/components/Palabras';

export const metadata: Metadata = { title: 'Tus palabras · A Sus Espaldas' };

export default function Page() {
  return <Palabras />;
}
