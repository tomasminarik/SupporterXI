'use client';

import { useEffect, useState } from 'react';
import FixtureBuilder from './fixture-builder';
import { FixtureMessage } from './fixture-headline';
import Notice from '../design/notice';
import { Button } from '../design/button';
import { featuredResponseSchema, type FeaturedResponse } from '../domain/featured-fixture';

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

  const retry = <Button onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Try again</Button>;
  if (!data) return <div aria-busy={!failed}>
    {failed ? <><FixtureMessage title="Fixture unavailable" /><Notice tone="problem" role="alert" title="We couldn’t load the next fixture." action={retry}>Check your connection, then try again.</Notice></>
      : <FixtureMessage loading title="Loading next fixture…"><p className="sx-details">Checking the published match information.</p></FixtureMessage>}
  </div>;
  const stale = failed && <Notice tone="attention" role="alert" title="Showing the last loaded fixture information." action={retry}>It may be out of date.</Notice>;
  return <FixtureBuilder context={data} alert={stale} />;
}
