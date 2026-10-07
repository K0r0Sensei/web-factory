import type { Metadata } from 'next';
import '../src/app/globals.css';

export const metadata: Metadata = {
  title: 'Web Factory V1',
  description: 'Generador de webs para negocios locales',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
