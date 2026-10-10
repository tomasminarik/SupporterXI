import { cookies } from 'next/headers';
import Link from 'next/link';
import { adminConfig, readSession, sessionCookie } from '../../server/admin/security';
import AdminWorkspace from '../../components/admin-workspace';
import '../../components/admin.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administration · Supporter XI', robots: { index: false, follow: false } };
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const config = adminConfig();
  const session = config ? readSession((await cookies()).get(sessionCookie)?.value, config) : null;
  const failed = (await searchParams).auth === 'failed';
  return <main className="admin-shell"><Link href="/">← Supporter XI</Link><p className="eyebrow">Club desk / Administration</p><h1>The club desk.</h1><p className="admin-intro">Manage the next match, keep the squad current and choose who is available.</p>
    {!config ? <section className="admin-box"><h2>Administration is not connected yet.</h2><p>This deployment cannot read or change repository content. Configure the production GitHub integration to enable sign-in.</p></section> : !session ? <section className="admin-box"><h2>Administrator sign-in</h2><p>Only the configured administrator can manage fixtures, squad and availability.</p>{failed && <p role="alert">Sign-in failed or this GitHub account is not authorized. Try again with the administrator account.</p>}<a className="admin-button" href={`${config.origin}/api/admin/auth/login`}>Sign in with GitHub</a></section> : <AdminWorkspace/>}
  </main>;
}
