import type { Metadata } from 'next';
import Link from 'next/link';
import ContactEmail from '../../components/contact-email';
import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';
import '../plain.css';

// Wording approved by the user on 12 October 2026 (docs/reviews/legal-review.md). The site is run from Sweden.
export const metadata: Metadata = {
  title: 'Privacy — Supporter XI',
  description: 'What Supporter XI does and does not do with your data.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return <div className="sx">
    <a className="sx-skip" href="#main">Skip to content</a>
    <SiteHeader share={false} />
    <main id="main" tabIndex={-1} className="pl-main">
      <p className="sx-label">Supporter XI</p>
      <h1>Privacy</h1>
      <p className="pl-lead">Supporter XI is run by Tomas Minarik, Sweden. Contact: <ContactEmail />.</p>

      <h2>Your lineup stays with you</h2>
      <p>The team you build is saved in your browser so it is still there when you come back. It is never sent to us. Clearing your browser data removes it.</p>

      <h2>Visit statistics</h2>
      <p>We count visits and a few actions, such as opening the share dialog, to see whether the site is used. We use PostHog, on servers in the EU. No cookies are set, nothing is stored on your device, your IP address is not kept, and no profile of you is built. We never record which players, formation or roles you choose.</p>
      <p>We do this on the basis of our legitimate interest in knowing how the site is used.</p>

      <h2>Hosting</h2>
      <p>The site is hosted by Vercel, which processes technical request data, including IP addresses, to deliver the site and keep it secure. Vercel is a US company and may process this data outside the EU under approved transfer safeguards.</p>

      <h2>Email</h2>
      <p>If you write to us, we use your message and address only to reply.</p>

      <h2>Players</h2>
      <p>The squad list shows professional players’ names and shirt numbers, taken from public information. If you are a player or act for one and want something corrected, write to us.</p>

      <h2>Your rights</h2>
      <p>You can ask what data we hold about you, ask for it to be corrected or deleted, and object to its use. Because we keep no data that identifies visitors, there will usually be nothing to find.</p>
      <p>You can complain to the data protection authority in your country. In Sweden that is the Swedish Authority for Privacy Protection (IMY).</p>

      <h2>No guarantees</h2>
      <p>Supporter XI is provided as it is, free of charge. Fixture and squad information may be out of date or wrong; check official sources.</p>

      <p className="pl-updated">Last updated 12 October 2026.</p>
      <p><Link href="/">Back to the builder</Link></p>
    </main>
    <SiteFooter />
  </div>;
}
