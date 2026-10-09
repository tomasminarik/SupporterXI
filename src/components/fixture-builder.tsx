'use client';

import { useEffect, useReducer, useSyncExternalStore, type ReactNode } from 'react';
import { discardDraft, draftKey, readDraft, writeDraft } from '../domain/draft';
import { initializeSession, sessionReducer } from '../domain/builder-session';
import { type FeaturedResponse } from '../domain/featured-fixture';
import { FixtureHeadline, FixtureMessage } from './fixture-headline';
import LineupEditor from './lineup-editor';

const subscribe = () => () => {};
type Props = { context: FeaturedResponse; storageKey?: string; alert?: ReactNode };

export default function FixtureBuilder(props: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (mounted) return <Session {...props} />;
  return <>{props.context.fixture ? <FixtureHeadline fixture={props.context.fixture} /> : <NoFixture />}<p className="sx-notice sx-muted">Checking browser memory…</p></>;
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
  function startCurrent() {
    if (state.draft && !window.confirm('Start the new fixture with an empty XI? This replaces the lineup remembered in this browser.')) return;
    const ok = discardDraft(() => localStorage, storageKey);
    dispatch({ type: 'start', context });
    dispatch({ type: 'memory', ok });
  }
  // The headline always names the match this XI belongs to.
  const shown = state.draft?.fixture ?? context.fixture;
  return <div className="sx-session">
    {shown ? <FixtureHeadline fixture={shown} /> : <NoFixture />}
    {alert}
    {state.recovery && <div className="sx-notice" role="status">
      <strong>{state.recovery === 'invalid' ? 'This browser’s lineup could not be restored.' : `Your remembered XI belongs to ${state.previousOpponent}.`}</strong>
      <p>{state.recovery === 'invalid' ? 'Its format or players no longer match this builder. Reset it to start again.' : 'Players will not be carried into a different fixture. Start fresh when you’re ready.'}</p>
      <button type="button" className="sx-secondary" onClick={startCurrent}>{context.fixture ? 'Reset and start this fixture' : 'Discard remembered XI'}</button>
    </div>}
    {changed && <div className="sx-notice" role="status"><strong>{context.fixture ? `The featured match is now ${context.fixture.opponent}.` : 'This match is no longer featured.'}</strong><p>Your open XI keeps its match context and last loaded squad information.</p>{context.fixture && <button type="button" className="sx-secondary" onClick={startCurrent}>Start new fixture</button>}</div>}
    {state.draft && <>
      <LineupEditor key={state.draft.fixture.id} lineup={state.draft.lineup} players={state.draft.players} onChange={(lineup) => dispatch({ type: 'edit', lineup })} />
      <p className="sx-memory" role="status">{state.memory === 'unavailable' ? 'Browser memory is unavailable. You can keep building here, but current edits may be lost on reload.' : `${state.restored ? 'Restored from this browser. ' : ''}Remembered on this browser only. Clearing browser data removes this XI.`}</p>
    </>}
  </div>;
}
