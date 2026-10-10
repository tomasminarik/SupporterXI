import type { Metadata } from 'next';
import { isIndexable, publicOrigin } from '../domain/site';
import '../design/tokens.css';
import '../design/components.css';
import './globals.css';
import { club } from '../design/club';

export const metadata: Metadata = {
  title: `Supporter XI — ${club.name} lineup builder`,
  description: `Pick your ${club.name} starting XI for the next match.`,
  metadataBase: new URL(publicOrigin),
  robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
