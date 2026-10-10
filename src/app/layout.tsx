import type { Metadata, Viewport } from 'next';
import { isIndexable, publicOrigin } from '../domain/site';
import '../design/tokens.css';
import '../design/components.css';
import './globals.css';
import { club } from '../design/club';

// What people search for comes first in the title; the product name closes it.
const title = `${club.name} lineup builder — pick your starting XI | Supporter XI`;
const description = `Pick your ${club.name} starting XI for the next match. Choose from 14 formations, give players a role and share your lineup as an image. Free, no account.`;

export const metadata: Metadata = {
  title,
  description,
  applicationName: 'Supporter XI',
  metadataBase: new URL(publicOrigin),
  robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
  // The preview image is src/app/opengraph-image.png, drawn by scripts/generate-social-images.mjs.
  openGraph: { type: 'website', siteName: 'Supporter XI', locale: 'en_GB', url: '/', title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export const viewport: Viewport = { themeColor: '#0c0e0d' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
