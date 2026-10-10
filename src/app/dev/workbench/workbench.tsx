'use client';

import { useState } from 'react';
import Link from 'next/link';
import { initialSquad } from '../../../domain/squad';
import { type FeaturedResponse } from '../../../domain/featured-fixture';
import { previewDraftKey } from '../../../domain/draft';
import FixtureBuilder from '../../../components/fixture-builder';
import SiteHeader from '../../../components/site-header';
import { ShareProvider } from '../../../share/share-context';

const firstId = '20000000-0000-4000-8000-000000000001';
const secondId = '20000000-0000-4000-8000-000000000002';
const previewContext: FeaturedResponse = {
  schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: '2026-10-07T12:00:00Z', nextRefreshAt: null, locked: false,
  fixture: { id: firstId, opponent: 'Preview opponent A (synthetic)', venue: 'home', competition: 'Development example', round: null, status: 'scheduled', kickoff: { kind: 'unknown' } },
  players: initialSquad.map((player) => ({ ...player, selectable: true })),
};
export default function Workbench() {
  const [context, setContext] = useState(previewContext);
  return <div className="sx">
    <a className="sx-skip" href="#workbench">Skip to workbench</a>
    <ShareProvider>
      <SiteHeader />
      <main id="workbench" tabIndex={-1}>
        <div className="sx-dev">
          <p><strong>Preview only</strong> — these match labels are synthetic. Try the real builder and browser memory without publishing fixture data. This preview uses a separate browser draft from the live site. <Link href="/">Back to Supporter XI</Link></p>
          <div className="sx-dev-controls"><button type="button" className="sx-secondary" onClick={() => setContext({ ...context, fixture: { ...context.fixture!, id: secondId, opponent: 'Preview opponent B (synthetic)' } })}>Simulate next fixture</button><button type="button" className="sx-secondary" onClick={() => setContext({ ...context, locked: !context.locked, nextRefreshAt: context.locked ? null : '2026-10-07T13:45:00Z' })}>{context.locked ? 'Unlock the match' : 'Simulate kick-off plus 15 minutes'}</button><button type="button" className="sx-secondary" onClick={() => setContext({ ...context, players: context.players.map((player, i) => i === 0 ? { ...player, selectable: !player.selectable } : player) })}>Toggle Senne Lammens availability</button></div>
        </div>
        <FixtureBuilder context={context} storageKey={previewDraftKey}/>
      </main>
    </ShareProvider>
  </div>;
}
