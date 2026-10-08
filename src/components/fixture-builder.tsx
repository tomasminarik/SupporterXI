'use client';

import { useEffect, useReducer, useSyncExternalStore } from 'react';
import { discardDraft, draftKey, readDraft, writeDraft } from '../domain/draft';
import { initializeSession, sessionReducer } from '../domain/builder-session';
import { formatKickoff, type FeaturedResponse } from '../domain/featured-fixture';
import LineupEditor from './lineup-editor';

const subscribe = () => () => {};
export default function FixtureBuilder(props: { context: FeaturedResponse; storageKey?: string }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return mounted ? <Session {...props} /> : <p>Checking browser memory…</p>;
}
function Session({ context, storageKey = draftKey }: { context: FeaturedResponse; storageKey?: string }) {
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
  return <div className="fixture-session">
    {state.recovery && <div className="session-recovery" role="status">
      <strong>{state.recovery === 'invalid' ? 'This browser’s lineup could not be restored.' : `Your remembered XI belongs to ${state.previousOpponent}.`}</strong>
      <p>{state.recovery === 'invalid' ? 'Its format or players no longer match this builder. Reset it to start again.' : 'Players will not be carried into a different fixture. Start fresh when you’re ready.'}</p>
      <button type="button" onClick={startCurrent}>{context.fixture ? 'Reset and start this fixture' : 'Discard remembered XI'}</button>
    </div>}
    {state.draft && <>
      <div className="session-context"><strong>Your XI · {state.draft.fixture.venue === 'home' ? 'vs' : 'at'} {state.draft.fixture.opponent}</strong><br/><span>{state.draft.fixture.kickoff.kind === 'confirmed' ? formatKickoff(state.draft.fixture.kickoff.at) : 'Time to be confirmed'}</span></div>
      {changed && <div className="session-transition" role="status"><strong>{context.fixture ? `The featured match is now ${context.fixture.opponent}.` : 'This match is no longer featured.'}</strong><p>Your open XI keeps its match context and last loaded squad information.</p>{context.fixture && <button type="button" onClick={startCurrent}>Start new fixture</button>}</div>}
      <p className="session-memory" role="status">{state.memory === 'unavailable' ? 'Browser memory is unavailable. You can keep building here, but current edits may be lost on reload.' : `${state.restored ? 'Restored from this browser. ' : ''}Remembered on this browser only. Clearing browser data removes this XI.`}</p>
      <LineupEditor key={state.draft.fixture.id} lineup={state.draft.lineup} players={state.draft.players} onChange={(lineup) => dispatch({ type: 'edit', lineup })}/>
    </>}
  </div>;
}
