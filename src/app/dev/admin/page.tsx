import { notFound } from 'next/navigation';
import Link from 'next/link';
import AdminWorkspace from '../../../components/admin-workspace';
import raw from '../../../../content/shared.json';
import { contentSchema } from '../../../domain/content';
import type { SharedContent } from '../../../domain/content';
export const dynamic = 'force-dynamic';
export default function AdminPreview() {
  if (process.env.NODE_ENV !== 'development' && process.env.VERCEL_ENV !== 'preview') notFound();
  const demo: SharedContent = { schemaVersion: 2, players: contentSchema.parse(raw).players, fixtures: [], featuredFixtureId: null, fixtureAvailability: [] };
  return <main className="admin-shell"><Link href="/dev/workbench">← Builder preview</Link><p className="eyebrow">Development / Admin preview</p><h1>The club desk.</h1><p>Try the admin forms here. Changes stay in this page’s memory and reset on reload. This preview cannot publish or write to GitHub. Use synthetic fixture labels for testing.</p><AdminWorkspace demo={demo}/></main>;
}
