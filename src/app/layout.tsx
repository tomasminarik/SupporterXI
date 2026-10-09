import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Supporter XI — Manchester United lineup builder',
  description: 'Pick your Manchester United starting XI for the next match.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
