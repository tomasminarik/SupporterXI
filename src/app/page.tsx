import FeaturedFixture from '../components/featured-fixture';
import { initialSquad } from '../domain/squad';

export default function Home() {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="masthead">
        <span className="wordmark"><span className="mark" aria-hidden="true">XI</span> Starting XI</span>
        <span className="edition">A supporter’s whiteboard</span>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Manchester United / Lineup builder</p>
          <h1 id="page-title">Your team.<br /><span>Your starting eleven.</span></h1>
          <p className="lede">A place to put your next-match XI on the board.</p>
        </section>
        {(process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') && <aside className="local-preview"><strong>Interactive preview</strong><p>Try the formations, supplied squad and optional roles on an interactive pitch.</p><a href="/dev/workbench">Open the interactive whiteboard →</a></aside>}
        <FeaturedFixture />
        <details className="squad">
          <summary><span>Squad list <span className="count">{initialSquad.length} players</span></span><span className="expand" aria-hidden="true">+</span></summary>
          <p className="squad-note">The supplied squad. Match availability will be shown when a fixture is ready.</p>
          <ul>{initialSquad.map((player) => <li key={player.id}><span className="shirt-number"><span className="sr-only">Number </span>{player.shirtNumber}</span><span>{player.name}</span></li>)}</ul>
        </details>
      </main>
      <footer><span>Starting XI · Working title</span><span>Independent supporter project</span></footer>
    </div>
  );
}
