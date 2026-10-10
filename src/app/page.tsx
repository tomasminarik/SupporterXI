import FeaturedFixture from '../components/featured-fixture';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import { ShareProvider } from '../share/share-context';

// One address for search engines, whichever domain served the page.
export const metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <div className="sx">
      <a className="sx-skip" href="#main">Skip to content</a>
      <ShareProvider>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {(process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') && <p className="sx-dev"><a href="/dev/workbench">Development preview: open the workbench with synthetic fixtures →</a></p>}
          <FeaturedFixture />
        </main>
      </ShareProvider>
      <SiteFooter />
    </div>
  );
}
