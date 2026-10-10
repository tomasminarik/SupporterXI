'use client';
import { useMemo, useState } from 'react';
import { Button, Card, Checkbox, Empty, Input, Modal, Radio, Tag } from 'antd';
import type { EffectiveFixture, SharedContent } from '../domain/content';
import type { AdminCommand } from '../domain/admin';
import { planMode, samePlan, savedPlan, upcomingFixtures, type PlanMode, type PlayerPlan } from '../domain/availability-plan';

const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' });
const matchDate = (fixture: EffectiveFixture) => fixture.kickoff.kind === 'confirmed' ? day.format(new Date(fixture.kickoff.at)) : 'date to be confirmed';
const matchName = (fixture: EffectiveFixture) => `${fixture.opponent} (${fixture.venue === 'home' ? 'H' : 'A'})`;

type Props = { content: SharedContent; busy: boolean; save: (command: AdminCommand) => Promise<boolean> };

/** One list for the whole squad. Changes are collected here and saved together, as a single publication. */
export default function AdminAvailability({ content, busy, save }: Props) {
  const [now] = useState(() => Date.now());
  const [changes, setChanges] = useState<Record<string, PlayerPlan>>({});
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState<{ playerId: string; out: string[] } | null>(null);
  const upcoming = useMemo(() => upcomingFixtures(content, now), [content, now]);
  const next = upcoming[0];
  const opponent = (id: string) => upcoming.find((fixture) => fixture.id === id)?.opponent ?? 'a match';

  const squad = useMemo(() => {
    const out = (playerId: string) => planMode(savedPlan(content, playerId, upcoming), next?.id) !== 'available';
    // Ordered by what is saved, so a row never jumps while it is being edited.
    return content.players.filter((player) => player.active)
      .sort((a, b) => Number(out(b.id)) - Number(out(a.id)) || (a.shirtNumber ?? 100) - (b.shirtNumber ?? 100));
  }, [content, upcoming, next]);
  const needle = query.trim().toLocaleLowerCase();
  const rows = squad.filter((player) => `${player.shirtNumber ?? ''} ${player.name}`.toLocaleLowerCase().includes(needle));
  const changed = squad.filter((player) => changes[player.id]);
  const pickingPlayer = squad.find((player) => player.id === picking?.playerId);

  function set(playerId: string, plan: PlayerPlan) {
    setChanges((current) => {
      const rest = { ...current };
      delete rest[playerId];
      return samePlan(plan, savedPlan(content, playerId, upcoming)) ? rest : { ...rest, [playerId]: plan };
    });
  }
  function choose(playerId: string, mode: PlanMode) {
    if (mode === 'available') set(playerId, { untilCleared: false, out: [] });
    if (mode === 'long') set(playerId, { untilCleared: true, out: [] });
    if (mode === 'next' && next) set(playerId, { untilCleared: false, out: [next.id] });
  }
  function describe(plan: PlayerPlan, playerId: string) {
    const mode = planMode(plan, next?.id);
    if (mode === 'available') return 'Available';
    if (mode === 'next') return `Out vs ${opponent(plan.out[0])} only`;
    if (mode === 'matches') return plan.out.length === 1 ? `Out vs ${opponent(plan.out[0])}` : `Out for ${plan.out.length} matches: ${upcoming.filter((fixture) => plan.out.includes(fixture.id)).map((fixture) => fixture.opponent).join(', ')}`;
    // A saved one-match exception to a long-term absence is kept until this player is edited.
    const back = changes[playerId] ? [] : content.fixtureAvailability.filter((entry) => entry.playerId === playerId && entry.status === 'available' && upcoming.some((fixture) => fixture.id === entry.fixtureId));
    return `Out until you clear it${back.length ? `, except ${back.map((entry) => `vs ${opponent(entry.fixtureId)}`).join(', ')}` : ''}`;
  }
  async function publish() {
    const players = changed.map((player) => ({ playerId: player.id, unavailableUntilCleared: changes[player.id].untilCleared, unavailableFixtureIds: changes[player.id].untilCleared ? [] : changes[player.id].out }));
    if (await save({ kind: 'availability-plan', players })) setChanges({});
  }

  const outNext = next ? squad.filter((player) => { const plan = changes[player.id] ?? savedPlan(content, player.id, upcoming); return plan.untilCleared || plan.out.includes(next.id); }) : [];
  return <Card className="admin-box admin-availability">
    <div className="admin-availability-head">
      <div>
        <h2>Availability</h2>
        {next ? <p><strong>Next match: {matchName(next)}, {matchDate(next)}.</strong> {outNext.length ? `${outNext.length} out: ${outNext.map((player) => player.name).join(', ')}.` : 'Everyone is available.'}</p>
          : <p>No match is featured yet. A player can still be marked out until you clear it.</p>}
      </div>
      <Input.Search allowClear aria-label="Find a player" placeholder="Find a player" value={query} onChange={(event) => setQuery(event.target.value)} />
    </div>
    <p className="admin-hint">Unavailable players stay on the public squad list, greyed out and last. Nothing changes on the site until you save.</p>
    <div className="admin-roster">
      {rows.map((player) => {
        const plan = changes[player.id] ?? savedPlan(content, player.id, upcoming);
        const mode = planMode(plan, next?.id);
        return <div className="admin-roster-row" key={player.id} data-out={mode !== 'available'}>
          <div className="admin-roster-player"><span className="admin-number">{player.shirtNumber ?? '—'}</span><span><span className="admin-roster-name">{player.name}{changes[player.id] && <Tag color="warning">Not saved</Tag>}</span><span className="admin-availability-status">{describe(plan, player.id)}</span></span></div>
          <div className="admin-roster-controls">
            <Radio.Group aria-label={`Availability: ${player.name}`} optionType="button" buttonStyle="solid" value={mode === 'matches' ? undefined : mode} onChange={(event) => choose(player.id, event.target.value)}
              options={[{ value: 'available', label: 'Available' }, { value: 'next', label: 'Out next match', disabled: !next }, { value: 'long', label: 'Out until cleared' }]} />
            <Button type={mode === 'matches' ? 'primary' : 'default'} disabled={!upcoming.length} aria-label={`Pick matches: ${player.name}`} onClick={() => setPicking({ playerId: player.id, out: plan.untilCleared ? [] : plan.out })}>{mode === 'matches' ? `${plan.out.length} ${plan.out.length === 1 ? 'match' : 'matches'}…` : 'Pick matches…'}</Button>
          </div>
        </div>;
      })}
      {!rows.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No players match." />}
    </div>
    <p className="admin-hint">Players who have left are switched to Inactive in Squad, and are not listed here or on the site.</p>
    {changed.length > 0 && <div className="admin-savebar" role="region" aria-label="Unsaved availability changes">
      <p><strong>{changed.length} unsaved {changed.length === 1 ? 'change' : 'changes'}</strong>{changed.map((player) => player.name).join(', ')}</p>
      <Button onClick={() => setChanges({})}>Discard</Button>
      <Button type="primary" loading={busy} onClick={() => void publish()}>Save and publish</Button>
    </div>}
    <Modal title={`Matches ${pickingPlayer?.name ?? ''} will miss`} open={picking !== null} onCancel={() => setPicking(null)} okText="Done" cancelText="Cancel"
      onOk={() => { if (picking) set(picking.playerId, { untilCleared: false, out: picking.out }); setPicking(null); }}>
      <p>Tick every match to miss. This replaces “out until cleared” for this player.</p>
      <Checkbox.Group className="admin-match-list" value={picking?.out ?? []} onChange={(out) => setPicking((current) => current && { ...current, out })}
        options={upcoming.map((fixture) => ({ value: fixture.id, label: `${matchName(fixture)} · ${matchDate(fixture)}` }))} />
    </Modal>
  </Card>;
}
