'use client';
import Link from 'next/link';
import { Alert, Button, Card } from 'antd';

const github = <svg aria-hidden="true" width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.33.66.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"/></svg>;

/** The signed-out backoffice: one card, one way in. Without `loginUrl` this deployment has no admin connection. */
export default function AdminSignIn({ loginUrl, failed = false }: { loginUrl: string | null; failed?: boolean }) {
  return <main className="admin-signin">
    <Card className="admin-signin-card">
      <p className="admin-signin-brand">Supporter XI</p>
      <h1>Gaffer</h1>
      {loginUrl ? <>
        <p>The backoffice for fixtures, the squad and who is available. One administrator account can sign in.</p>
        {failed && <Alert type="error" showIcon role="alert" title="Sign-in didn’t work" description="GitHub did not confirm the administrator account. Try again with that account." />}
        <Button type="primary" size="large" block icon={github} href={loginUrl}>Sign in with GitHub</Button>
        <p className="admin-signin-note">GitHub only confirms who you are. You stay signed in for two hours.</p>
      </> : <>
        <h2>Not connected on this deployment</h2>
        <p>The backoffice only works on the production site, where its GitHub connection is configured.</p>
      </>}
    </Card>
    <Link href="/">← Back to Supporter XI</Link>
  </main>;
}
