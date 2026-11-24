import type { Metadata } from 'next';
import Paseo from '@/features/a-sus-espaldas/components/paseo/Paseo';

export const metadata: Metadata = { title: 'A Sus Espaldas · El paseo' };

export default function Page() {
  return <Paseo />;
}
