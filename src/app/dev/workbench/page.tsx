import { notFound } from 'next/navigation';
import Workbench from './workbench';

export const dynamic = 'force-dynamic';
export default function WorkbenchPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.VERCEL_ENV !== 'preview') notFound();
  return <Workbench />;
}
