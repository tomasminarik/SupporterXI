import { notFound } from 'next/navigation';
import AdminWorkspace from '../../../components/admin-workspace';
import AdminSignIn from '../../../components/admin-sign-in';
import raw from '../../../../content/shared.json';
import { contentSchema } from '../../../domain/content';
import type { SharedContent } from '../../../domain/content';
export const dynamic = 'force-dynamic';
export default async function AdminPreview({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.NODE_ENV !== 'development' && process.env.VERCEL_ENV !== 'preview') notFound();
  // The sign-in card cannot be reached locally, so the preview can show it: /dev/admin?view=sign-in (or sign-in-failed).
  const view = (await searchParams).view;
  if (view === 'sign-in' || view === 'sign-in-failed') return <AdminSignIn loginUrl="/dev/admin" failed={view === 'sign-in-failed'} />;
  const demo: SharedContent = { schemaVersion: 2, players: contentSchema.parse(raw).players, fixtures: [], featuredFixtureId: null, fixtureAvailability: [] };
  return <main className="admin-shell"><AdminWorkspace demo={demo} /></main>;
}
