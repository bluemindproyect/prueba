import type { Metadata } from 'next';
import Story from '@/components/tres-anos/Story';

export const metadata: Metadata = { title: 'Tres Años' };

export default function Page() {
  return <Story />;
}
