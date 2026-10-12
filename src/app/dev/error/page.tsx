import { notFound } from 'next/navigation';
import Crash from './crash';

// Shows the error page (src/app/error.tsx) on purpose, in development and previews only.
export const dynamic = 'force-dynamic';
export default function ErrorPreview() {
  if (process.env.NODE_ENV !== 'development' && process.env.VERCEL_ENV !== 'preview') notFound();
  return <Crash />;
}
