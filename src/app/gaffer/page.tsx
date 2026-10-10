import { cookies } from 'next/headers';
import { adminConfig, readSession, sessionCookie } from '../../server/admin/security';
import AdminWorkspace from '../../components/admin-workspace';
import AdminSignIn from '../../components/admin-sign-in';
import '../../components/admin.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gaffer · Supporter XI', robots: { index: false, follow: false } };
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const config = adminConfig();
  const session = config ? readSession((await cookies()).get(sessionCookie)?.value, config) : null;
  if (!config) return <AdminSignIn loginUrl={null} />;
  if (!session) return <AdminSignIn loginUrl={`${config.origin}/api/admin/auth/login`} failed={(await searchParams).auth === 'failed'} />;
  return <main className="admin-shell"><AdminWorkspace /></main>;
}
