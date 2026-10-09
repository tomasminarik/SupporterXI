import FeaturedFixture from '../components/featured-fixture';
import SiteHeader from '../components/site-header';

export default function Home() {
  return (
    <div className="sx">
      <a className="sx-skip" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {(process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') && <p className="sx-dev"><a href="/dev/workbench">Development preview: open the workbench with synthetic fixtures →</a></p>}
        <FeaturedFixture />
      </main>
      <footer className="sx-footer"><span>Supporter XI</span><span>Independent supporter project</span></footer>
    </div>
  );
}
