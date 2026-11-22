import type { Metadata } from 'next';
import Story from '@/features/tres-anos/components/Story';

export const metadata: Metadata = { title: 'Tres Años' };

export default function Page() {
  return <Story />;
}
