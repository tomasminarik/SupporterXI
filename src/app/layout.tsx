import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Starting XI — Manchester United lineup builder',
  description: 'A starting XI whiteboard for Manchester United supporters.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
