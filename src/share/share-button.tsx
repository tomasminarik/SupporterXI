'use client';
import { Button } from '../design/button';

import { useRef, useState } from 'react';
import ShareDialog from './share-dialog';
import { track } from '../analytics/analytics';
import { useShareSource } from './share-context';
import { missingPlayers, takeSnapshot, type ShareSnapshot } from './snapshot';

/** "Share your XI" in the header. Until eleven players are picked it says how many are missing and
    takes you to the next empty position; it never opens an export of an incomplete XI. */
export default function ShareButton() {
  const source = useShareSource();
  const [snapshot, setSnapshot] = useState<ShareSnapshot | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  if (!source) return <>
    <Button variant="action" disabled aria-describedby="share-note">Share your XI</Button>
    <span id="share-note" className="sr-only">There is no lineup to share yet.</span>
  </>;
  const missing = missingPlayers(source);
  // A locked XI that was never finished cannot be completed any more, so there is nothing to pick.
  if (missing > 0 && source.locked) return <>
    <Button variant="action" disabled aria-describedby="share-note">Share your XI</Button>
    <span id="share-note" className="sr-only">This XI was not finished before the match locked, so it cannot be shared.</span>
  </>;
  if (missing > 0) {
    const nextEmpty = () => {
      const empty = document.querySelector<HTMLElement>('.sx-marker.sx-empty');
      empty?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      empty?.focus({ preventScroll: true });
    };
    return <>
      <Button variant="action" className="sx-share-waiting" aria-describedby="share-note" onClick={nextEmpty}>Pick {missing} more to share</Button>
      <span id="share-note" className="sr-only">Your XI needs {missing} more {missing === 1 ? 'player' : 'players'} before it can be shared as an image. This button moves to the next empty position.</span>
    </>;
  }
  // The snapshot is taken at this moment; the dialog only ever sees the copy.
  return <>
    <Button variant="action" ref={button} onClick={() => { const taken = takeSnapshot(source); setSnapshot(taken); if (taken) track('share_opened', { fixture: taken.fixtureId }); }}>Share your XI</Button>
    {snapshot && <ShareDialog snapshot={snapshot} onClose={() => { setSnapshot(null); button.current?.focus(); }} />}
  </>;
}
