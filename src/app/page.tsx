import FeaturedFixture from '../components/featured-fixture';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import { ShareProvider } from '../share/share-context';
import { club } from '../design/club';
import { publicOrigin } from '../domain/site';

// One address for search engines, whichever domain served the page.
export const metadata = { alternates: { canonical: '/' } };

// Tells search engines what the page is. It describes the site only, never a supporter's lineup.
const structuredData = {
  '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Supporter XI', url: publicOrigin,
  description: `A free ${club.name} lineup builder: pick a starting XI for the next match and share it as an image.`,
  applicationCategory: 'SportsApplication', operatingSystem: 'Any', isAccessibleForFree: true, inLanguage: 'en-GB',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
};

export default function Home() {
  return (
    <div className="sx">
      <a className="sx-skip" href="#main">Skip to content</a>
      <ShareProvider>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {(process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') && <p className="sx-dev"><a href="/dev/workbench">Development preview: open the workbench with synthetic fixtures →</a></p>}
          <FeaturedFixture />
          {/* Closed until asked for (user request, 11 October 2026); the words are still in the page for search engines. */}
          <details className="sx-about">
            <summary>What is Supporter XI?</summary>
            <p>Supporter XI is a free {club.name} lineup builder. Pick your starting XI for the next match from the current squad, choose one of 14 formations, and give each player a role if you like.</p>
            <p>When your team is ready, share it as an image. There is no account and nothing to sign up for: your lineup stays in your browser.</p>
            <p>This is an independent supporter project. It is not connected to {club.name}.</p>
          </details>
        </main>
      </ShareProvider>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </div>
  );
}
