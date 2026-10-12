'use client';

import { useEffect, useRef } from 'react';
import { Button } from '../design/button';
import { Logo } from '../design/brand';
import { discardDraft } from '../domain/draft';
import './plain.css';

// Shown in place of a page that failed to draw. The remembered XI is untouched unless the visitor chooses
// to clear it, which is the way out if the saved XI itself is what the page cannot draw.
export default function PageError({ reset }: { error: Error; reset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <div className="sx">
    <header className="sx-header"><Logo /></header>
    <main id="main" className="pl-main">
      <p className="sx-label">Stoppage</p>
      <h1 ref={heading} tabIndex={-1}>Play has stopped</h1>
      <p className="pl-lead" role="alert">Something went wrong on this page. Your XI is still saved in this browser.</p>
      <p>Try again first. If the page keeps stopping, start over with an empty XI.</p>
      <div className="pl-actions">
        <Button variant="primary" onClick={reset}>Try again</Button>
        {/* A full reload on purpose: the page that failed is thrown away, not navigated within. */}
        {/* eslint-disable-next-line @next/next/no-location-assign-relative-destination */}
        <Button onClick={() => { discardDraft(() => localStorage); window.location.assign('/'); }}>Clear my saved XI and reload</Button>
      </div>
    </main>
  </div>;
}
