import type { Metadata } from 'next';
import { isIndexable, publicOrigin } from '../domain/site';
import './globals.css';

export const metadata: Metadata = {
  title: 'Supporter XI — Manchester United lineup builder',
  description: 'Pick your Manchester United starting XI for the next match.',
  metadataBase: new URL(publicOrigin),
  robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
