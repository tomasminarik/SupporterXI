import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import TrackView from '../analytics/track-view';
import './not-found.css';

export const metadata: Metadata = { title: 'Page not found — Supporter XI' };

// The 404 page: a pitch set up in a "4-0-4". The midfield turns up, wanders off, and the line takes its place.
// Positions are [along the pitch, across it] in percent; the stylesheet turns the pitch upright on phones.
const keeper: [string, number, number][] = [['GK', 6, 50]];
const line = (along: number, labels: string[]): [string, number, number][] => labels.map((label, index) => [label, along, 14 + index * 24]);
const players = [...keeper, ...line(24, ['LB', 'CB', 'CB', 'RB']), ...line(76, ['LW', 'ST', 'ST', 'RW'])];
const missing: [number, number][] = [[50, 22], [50, 50], [50, 78]];
const at = (along: number, across: number, order: number) => ({ '--along': along, '--across': across, '--order': order }) as React.CSSProperties;

function Lines({ upright = false }: { upright?: boolean }) {
  // A 105 × 68 m pitch at 10 units per metre, as in the builder's markings.
  return <svg className={upright ? 'nf-lines nf-upright' : 'nf-lines nf-level'} viewBox={upright ? '0 0 680 1050' : '0 0 1050 680'} fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <g transform={upright ? 'translate(680 0) rotate(90)' : undefined}>
      {['M1.5 1.5H1048.5V678.5H1.5Z', 'M525 1.5V678.5', 'M525 248.5a91.5 91.5 0 1 0 0 183a91.5 91.5 0 1 0 0-183Z',
        'M1.5 138.5H166.5V541.5H1.5', 'M1.5 248.5H56.5V431.5H1.5', 'M166.5 267a91.5 91.5 0 0 1 0 146',
        'M1048.5 138.5H883.5V541.5H1048.5', 'M1048.5 248.5H993.5V431.5H1048.5', 'M883.5 267a91.5 91.5 0 0 0 0 146',
      ].map((d) => <path key={d} d={d} pathLength={1} />)}
    </g>
  </svg>;
}

export default function NotFound() {
  return <div className="sx nf">
    <a className="sx-skip" href="#main">Skip to content</a>
    <SiteHeader share={false} />
    <main id="main" tabIndex={-1} className="nf-main">
      <p className="sx-label nf-label">Formation</p>
      <h1><span aria-hidden="true">4-0-4</span><span className="sr-only">404: page not found</span></h1>
      <div className="nf-pitch">
        <div className="nf-art" role="img" aria-label="A pitch set up in a 4-0-4: a goalkeeper, four defenders, four forwards and nobody in midfield.">
          <Lines /><Lines upright />
          {players.map(([label, along, across], index) => <span key={index} className="nf-player" style={at(along, across, index)}>{label}</span>)}
          {missing.map(([along, across], index) => <span key={index} className="nf-missing" style={at(along, across, index)} />)}
        </div>
        <p className="nf-joke">Like our midfield, this page has gone missing.</p>
      </div>
      <p className="nf-action"><Link className="sx-primary nf-back" href="/">Back to the builder</Link></p>
    </main>
    <SiteFooter />
    <TrackView event="not_found_seen" />
  </div>;
}
