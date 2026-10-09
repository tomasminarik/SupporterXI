import { formatKickoff, type FeaturedResponse } from '../domain/featured-fixture';

type Fixture = NonNullable<FeaturedResponse['fixture']>;

// The page is in English, so the kickoff is too; the time stays in the visitor's own time zone.

// The fixture is the page's dominant element: club in red, "v" in grey, opponent in white.
export function FixtureHeadline({ fixture }: { fixture: Fixture }) {
  const long = fixture.opponent.length > 18;
  return <section className="sx-fixture" aria-labelledby="fixture-title">
    <h1 id="fixture-title" className={long ? 'sx-headline sx-long' : 'sx-headline'}><span className="sx-club">Manchester United</span> <span className="sx-v">v</span> <span className="sx-opponent">{fixture.opponent}</span></h1>
    <p className="sx-details">
      {[fixture.competition, fixture.round, fixture.venue === 'home' ? 'Home' : 'Away'].filter(Boolean).map((part) => <span key={part}>{part}</span>)}
      <span>{fixture.kickoff.kind === 'confirmed' ? <time dateTime={fixture.kickoff.at}>{formatKickoff(fixture.kickoff.at, 'en-GB')}</time> : 'Time to be confirmed'}</span>
    </p>
  </section>;
}

/** Loading, failure and no-fixture states share the headline position. */
export function FixtureMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return <section className="sx-fixture sx-fixture-message" aria-labelledby="fixture-title">
    <h1 id="fixture-title" className="sx-headline sx-message">{title}</h1>
    {children}
  </section>;
}
