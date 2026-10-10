import { formatKickoff, type FeaturedResponse } from '../domain/featured-fixture';
import { club } from '../design/club';

type Fixture = NonNullable<FeaturedResponse['fixture']>;

// The page is in English, so the kickoff is too; the time stays in the visitor's own time zone.

// The fixture is the page's dominant element: club in red, "v" in grey, opponent in white.
export function FixtureHeadline({ fixture }: { fixture: Fixture }) {
  const long = fixture.opponent.length > 18;
  // "v" never stands alone on a line: it stays with the opponent's first word.
  const [first, ...rest] = fixture.opponent.trim().split(/\s+/);
  return <section className="sx-fixture" aria-labelledby="fixture-title">
    <h1 id="fixture-title" className={long ? 'sx-headline sx-long' : 'sx-headline'}><span className="sx-club">{club.name}</span> <span className="sx-versus"><span className="sx-v">v</span> <span className="sx-opponent">{first}</span></span>{rest.length > 0 && <span className="sx-opponent"> {rest.join(' ')}</span>}</h1>
    <p className="sx-details">
      {[fixture.competition, fixture.round, fixture.venue === 'home' ? 'Home' : 'Away'].filter(Boolean).map((part) => <span key={part}>{part}</span>)}
      <span>{fixture.kickoff.kind === 'confirmed' ? <time dateTime={fixture.kickoff.at}>{formatKickoff(fixture.kickoff.at, 'en-GB')}</time> : 'Time to be confirmed'}</span>
    </p>
  </section>;
}

/** Loading, failure and no-fixture states keep the headline's shape: the club in red, the state in white.
    While loading, a quiet bar stands where the opponent will be; no opponent is invented. */
export function FixtureMessage({ title, loading = false, children }: { title: string; loading?: boolean; children?: React.ReactNode }) {
  return <section className="sx-fixture sx-fixture-message" aria-labelledby="fixture-title">
    <h1 id="fixture-title" className="sx-headline sx-long"><span className="sx-club">{club.name}</span> {loading
      ? <><span className="sx-v" aria-hidden="true">v</span> <span className="sx-skeleton" aria-hidden="true" /><span className="sr-only">{title}</span></>
      : <span className="sx-opponent">{title}</span>}</h1>
    {children}
  </section>;
}
