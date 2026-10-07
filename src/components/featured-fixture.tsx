'use client';

import { useEffect, useState } from 'react';
import { featuredResponseSchema, formatKickoff, type FeaturedResponse } from '../domain/featured-fixture';

export default function FeaturedFixture() {
  const [data, setData] = useState<FeaturedResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    let pending = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const refresh = async () => {
      if (pending || disposed) return;
      pending = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10_000);
      try {
        const response = await fetch('/api/featured-fixture', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Fixture request failed');
        const next = featuredResponseSchema.parse(await response.json());
        if (disposed) return;
        setData(next); setFailed(false);
        clearTimeout(timer);
        // Use elapsed time from server time, never the visitor's wall clock.
        const remaining = next.nextRefreshAt ? Date.parse(next.nextRefreshAt) - Date.parse(next.serverNow) : null;
        if (remaining !== null) timer = setTimeout(refresh, Math.min(Math.max(remaining, 100), 2_147_000_000));
      } catch {
        if (!disposed) setFailed(true);
      } finally { clearTimeout(timeout); pending = false; }
    };
    void refresh();
    const onFocus = () => { void refresh(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { disposed = true; clearTimeout(timer); controller?.abort(); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVisibility); };
  }, [attempt]);

  const fixture = data?.fixture;
  return <section className="whiteboard" aria-labelledby="fixture-title" aria-busy={!data && !failed}>
    <div className="board-heading"><span>01 / Next fixture</span><span className="status">{failed ? 'Unable to refresh' : !data ? 'Loading fixture' : fixture ? 'Next match' : 'Awaiting fixture'}</span></div>
    <div className="board-body"><div className="empty-copy">
      <span className="small-rule" aria-hidden="true" />
      {!data ? <><h2 id="fixture-title">{failed ? 'Fixture unavailable' : 'Loading next fixture…'}</h2><p>{failed ? 'We couldn’t load the next fixture. Please try again.' : 'Checking the published match information.'}</p></> : fixture ? <>
        <p>{[fixture.competition, fixture.round].filter(Boolean).join(' · ')}</p>
        <h2 id="fixture-title">Manchester United<br/>{fixture.venue === 'home' ? 'vs' : 'at'} {fixture.opponent}</h2>
        <p>{fixture.venue === 'home' ? 'Home' : 'Away'}</p>
        {fixture.kickoff.kind === 'confirmed' ? <p><time dateTime={fixture.kickoff.at}>{formatKickoff(fixture.kickoff.at)}</time></p> : <p>Time to be confirmed</p>}
      </> : <><h2 id="fixture-title">No upcoming fixture</h2><p>No eligible match is currently published. There’s no lineup to pick until a fixture is available.</p><p className="quiet">Check back once the next match is added.</p></>}
      {failed && <div role="alert">{data && <p className="quiet">Showing the last loaded fixture information. It may be out of date.</p>}<button className="fixture-retry" type="button" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Try again</button></div>}
    </div><div className="pitch-wrap" aria-hidden="true"><svg className="pitch" viewBox="0 0 260 340" fill="none"><rect x="20" y="15" width="220" height="310" rx="1"/><path d="M20 170H240M75 15V64H185V15M100 15V34H160V15M75 325V276H185V325M100 325V306H160V325"/><circle cx="130" cy="170" r="35"/><circle cx="130" cy="170" r="2"/><path d="M110 64Q130 88 150 64M110 276Q130 252 150 276"/></svg><span className="pitch-caption">The board is yours. Soon.</span></div></div>
  </section>;
}
