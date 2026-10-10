'use client';

import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { discardDraft, draftKey, readDraft, writeDraft } from '../domain/draft';
import { initializeSession, sessionReducer } from '../domain/builder-session';
import { formatClock, type FeaturedResponse } from '../domain/featured-fixture';
import { FixtureHeadline, FixtureMessage } from './fixture-headline';
import LineupEditor from './lineup-editor';
import Notice from './notice';
import { usePublishShareSource } from '../share/share-context';

const subscribe = () => () => {};
type Props = { context: FeaturedResponse; storageKey?: string; alert?: ReactNode };

export default function FixtureBuilder(props: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (mounted) return <Session {...props} />;
  return <>{props.context.fixture ? <FixtureHeadline fixture={props.context.fixture} /> : <NoFixture />}<p className="sx-pending">Checking browser memory…</p></>;
}

function NoFixture() {
  return <FixtureMessage title="No upcoming fixture"><p className="sx-details">No eligible match is currently published. There’s no lineup to pick until a fixture is available.</p><p className="sx-details sx-muted">Check back once the next match is added.</p></FixtureMessage>;
}

function Session({ context, storageKey = draftKey, alert }: Props) {
  const [state, dispatch] = useReducer(sessionReducer, null, () => initializeSession(context, readDraft(() => localStorage, storageKey)));
  useEffect(() => { dispatch({ type: 'published', context }); }, [context]);
  useEffect(() => {
    if (state.draft && !state.recovery) dispatch({ type: 'memory', ok: writeDraft(() => localStorage, state.draft, storageKey) });
  }, [state.draft, state.recovery, storageKey]);
  const changed = state.draft && context.fixture?.id !== state.draft.fixture.id;
  // From 15 minutes after kickoff the XI can be looked at and shared, not changed. An XI still open for
  // a match that is no longer featured stays that way.
  const locked = Boolean(state.draft && (changed || context.locked));
  // The header's share button works from the open XI.
  const shareSource = useMemo(() => state.draft && !state.recovery ? { ...state.draft, locked } : null, [state.draft, state.recovery, locked]);
  usePublishShareSource(shareSource);
  // Starting the next fixture discards the open XI, so the notice asks once more in place.
  const [asked, setAsked] = useState<string | null>(null);
  const confirming = asked !== null && asked === context.fixture?.id;
  const root = useRef<HTMLDivElement>(null);
  const focusAction = (name: string) => requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-action=${name}]`)?.focus());
  function startCurrent() {
    const ok = discardDraft(() => localStorage, storageKey);
    dispatch({ type: 'start', context });
    dispatch({ type: 'memory', ok });
    if (confirming) { setAsked(null); requestAnimationFrame(() => root.current?.closest('main')?.focus()); }
  }
  function askStart() { setAsked(context.fixture?.id ?? null); focusAction('keep'); }
  function keep() { setAsked(null); focusAction('ask'); }
  // The headline always names the match this XI belongs to.
  const shown = state.draft?.fixture ?? context.fixture;
  return <div className="sx-session" ref={root}>
    {shown ? <FixtureHeadline fixture={shown} /> : <NoFixture />}
    {alert}
    {state.recovery && <Notice block tone={state.recovery === 'invalid' ? 'problem' : 'attention'}
      title={state.recovery === 'invalid' ? 'This browser’s lineup could not be restored.' : `Your remembered XI belongs to ${state.previousOpponent}.`}
      action={<button type="button" className="sx-primary" onClick={startCurrent}>{context.fixture ? 'Reset and start this fixture' : 'Discard remembered XI'}</button>}>
      {state.recovery === 'invalid' ? 'Its format or players no longer match this builder. Reset it to start again.' : 'Players will not be carried into a different fixture. Start fresh when you’re ready.'}
    </Notice>}
    {changed && (confirming && context.fixture
      ? <div onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); keep(); } }}><Notice tone="attention" title={`Start ${context.fixture.opponent} with an empty XI?`}
          action={<div className="sx-notice-actions"><button type="button" className="sx-secondary" data-action="keep" onClick={keep}>Keep this XI</button><button type="button" className="sx-primary" onClick={startCurrent}>Start with an empty XI</button></div>}>
          This replaces the lineup remembered in this browser.
        </Notice></div>
      : <Notice tone="attention" title={context.fixture ? `The featured match is now ${context.fixture.opponent}.` : 'This match is no longer featured.'}
          action={context.fixture && <button type="button" className="sx-secondary" data-action="ask" onClick={askStart}>Start new fixture</button>}>
          Your open XI belongs to the earlier match and can no longer be changed.
        </Notice>)}
    {state.draft && context.locked && !changed && <Notice title="This match has kicked off. Your XI is locked.">
      {context.nextRefreshAt ? <>You can still share it. The next match opens at <time dateTime={context.nextRefreshAt}>{formatClock(context.nextRefreshAt, 'en-GB')}</time>.</> : 'You can still share it. Lineups close 15 minutes after kick-off.'}
    </Notice>}
    {state.draft && state.memory === 'unavailable' && <Notice tone="attention" title="Browser memory is unavailable.">You can keep building here, but current edits may be lost on reload.</Notice>}
    {state.draft && <>
      <LineupEditor key={state.draft.fixture.id} lineup={state.draft.lineup} players={state.draft.players} locked={locked} onChange={(lineup) => { if (!locked) dispatch({ type: 'edit', lineup }); }} />
      {state.memory === 'available' && <p className="sx-memory" role="status"><span className="sx-memory-mark" aria-hidden="true">✓</span>{state.restored ? 'Restored from this browser. ' : ''}Remembered on this browser only. Clearing browser data removes this XI.</p>}
    </>}
  </div>;
}
