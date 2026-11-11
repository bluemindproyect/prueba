import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { DM_Mono, Instrument_Serif, Literata } from 'next/font/google';
import './globals.css';

const display = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const prose = Literata({
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-prose',
  display: 'swap',
});

const util = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-util',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Juegos de ficción',
  description: 'Ficción interactiva para adultos. Personajes e historias inventados.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: '#17121f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${prose.variable} ${util.variable}`}>
      <body>{children}</body>
    </html>
  );
}
