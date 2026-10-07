'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formations, roles, rolesForFamily } from '../../../domain/catalogues';
import { initialSquad } from '../../../domain/squad';
import { assignRole, changeFormation, clearLineup, emptyLineup, formationFor, movePlayer, placePlayer, removePlayer } from '../../../domain/lineup';
import './workbench.css';

const selectableIds = initialSquad.map((player) => player.id);
export default function Workbench() {
  const [lineup, setLineup] = useState(emptyLineup);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('Choose a formation to start with eleven empty slots.');
  const formation = formationFor(lineup);
  const slot = formation?.slots.find((item) => item[0] === selected);
  const assignment = selected ? lineup.slots[selected] : null;
  const player = initialSquad.find((item) => item.id === assignment?.playerId);
  const count = Object.values(lineup.slots).filter(Boolean).length;
  const unused = initialSquad.filter((item) => !Object.values(lineup.slots).some((itemSlot) => itemSlot?.playerId === item.id));
  const visible = unused.filter((item) => `${item.shirtNumber} ${item.name}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  function move(from: string, to: string) {
    setLineup((current) => movePlayer(current, from, to));
    setNotice(`Moved or swapped players from ${from.toUpperCase()} to ${to.toUpperCase()}. Roles stay with occupied slots.`);
    setSelected(to);
  }

  return <div className="lab">
    <a className="skip-link" href="#workbench">Skip to workbench</a>
    <header className="lab-header"><Link href="/">← Starting XI</Link><span>DEVELOPMENT / INTERACTIVE PREVIEW</span></header>
    <main id="workbench" tabIndex={-1}>
      <div className="lab-title"><div><p className="eyebrow">Manchester United / Tactical whiteboard</p><h1>Put your XI on the board.</h1></div><span className="lab-tally">{count}<span> / 11</span></span></div>
      <p className="lab-disclaimer">Preview only — no match is scheduled here. All 36 supplied players are available for testing; this does not set their match availability. Selections reset on reload.</p>
      <div className="lab-toolbar">
        <label>Formation<select value={lineup.formationId ?? ''} onChange={(event) => {
          const target = formations.find((item) => item.id === event.target.value);
          if (!target) return;
          const proposal = changeFormation(lineup, target);
          if ((proposal.releasedPlayers || proposal.clearedRoles) && !window.confirm(`Change to ${target.name}? ${proposal.releasedPlayers} player(s) will leave the XI and ${proposal.clearedRoles} retained-player role(s) will clear. Cancel keeps your XI unchanged.`)) return;
          setLineup(proposal.state); setSelected(null); setQuery('');
          setNotice(`${target.name} selected. ${proposal.releasedPlayers} players released; ${proposal.clearedRoles} incompatible roles cleared.`);
        }}><option value="" disabled>Choose a formation</option>{formations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <button type="button" disabled={!count} onClick={() => { setLineup(clearLineup(lineup)); setNotice('XI cleared. Formation retained.'); }}>Clear XI</button>
      </div>
      <p className="lab-notice" role="status">{notice}</p>
      <div className="lab-grid">
        <section className="lab-board" aria-label="Lineup pitch">
          <div className="lab-board-caption"><span>{formation?.name ?? 'No formation selected'}</span><span>Attacking ↑</span></div>
          <div className="lab-pitch">
            <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><rect x="3" y="3" width="94" height="94"/><path d="M3 50H97M25 3V20H75V3M38 3V10H62V3M25 97V80H75V97M38 97V90H62V97"/><ellipse cx="50" cy="50" rx="14" ry="10"/><path d="M40 20Q50 28 60 20M40 80Q50 72 60 80"/></svg>
            {!formation && <div className="lab-start"><span aria-hidden="true">XI</span><h2>Start with a shape.</h2><p>Choose one of the 14 formations above.<br/>Then select a position to add a player.</p></div>}
            {formation?.slots.map(([id, abbreviation, x, y]) => {
              const occupant = initialSquad.find((item) => item.id === lineup.slots[id]?.playerId);
              const role = roles.find((item) => item.id === lineup.slots[id]?.roleId);
              return <button key={id} id={`slot-${id}`} type="button" className={`lab-marker ${occupant ? 'filled' : ''}`} aria-pressed={selected === id} aria-label={`${abbreviation}: ${occupant?.name ?? 'Empty'}${role ? `, ${role.name}` : ''}`} style={{ left: `${8 + x * .84}%`, top: `${8 + (100 - y) * .84}%` }} draggable={!!occupant}
                onDragStart={(event) => { event.dataTransfer.setData('text/plain', id); event.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = event.dataTransfer.getData('text/plain'); if (lineup.slots[from]) move(from, id); }}
                onClick={() => { setSelected(id); setQuery(''); setNotice(`${abbreviation} selected. ${occupant ? 'Edit the player or role in the position panel.' : 'Choose a player in the position panel.'}`); }}>
                <span className="lab-token">{occupant?.shirtNumber ?? '+'}</span><span className="lab-position">{abbreviation}</span><span className="lab-name">{occupant?.name ?? 'Add player'}</span>{role && <span className="lab-role-indicator" aria-hidden="true">Role assigned</span>}
              </button>;
            })}
          </div>
          <p className="lab-help">Select a position, then a player. To move a player, use the position panel or drag their marker to another position.</p>
        </section>
        <section className="lab-panel" aria-labelledby="position-title">
          <div className="lab-panel-heading"><p className="eyebrow">Position panel</p><h2 id="position-title">{slot ? `${slot[1]} · ${player?.name ?? 'Choose a player'}` : 'Choose a position'}</h2></div>
          {!slot && <p className="lab-panel-empty">{formation ? 'Select any position on the pitch to add a player. Any squad player can fill any position.' : 'Choose a formation first. Your starting eleven begins empty.'}</p>}
          {slot && <>
            {assignment && <div className="lab-edit">
              <label>Optional role<select value={assignment.roleId ?? ''} onChange={(event) => { setLineup(assignRole(lineup, slot[0], event.target.value || null)); setNotice(event.target.value ? 'Role updated.' : 'Role removed.'); }}><option value="">No role</option>{rolesForFamily(slot[4]).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
              <p className="lab-definition">{roles.find((role) => role.id === assignment.roleId)?.shortDefinition ?? 'Roles are optional. Choose one to describe this player’s behaviour.'}</p>
              <details className="lab-role-guide"><summary>Role definitions</summary>{rolesForFamily(slot[4]).map((role) => <p key={role.id}><strong>{role.name}</strong><br/>{role.shortDefinition}</p>)}</details>
              <label>Move or swap to<select value="" onChange={(event) => { if (event.target.value) move(slot[0], event.target.value); }}><option value="">Choose a position</option>{formation?.slots.filter((item) => item[0] !== slot[0]).map((item) => <option key={item[0]} value={item[0]}>{item[1]} — {initialSquad.find((p) => p.id === lineup.slots[item[0]]?.playerId)?.name ?? 'Empty'}</option>)}</select></label>
              <button type="button" onClick={() => { setLineup(removePlayer(lineup, slot[0])); setNotice(`${player?.name} removed; slot role cleared.`); }}>Remove player</button>
            </div>}
            <div className="lab-chooser"><label htmlFor="player-search">{player ? 'Replace player' : 'Choose player'} <span>({unused.length} unselected)</span></label><input id="player-search" type="search" placeholder="Search name or number" value={query} onChange={(event) => setQuery(event.target.value)} />
              <div className="lab-player-list">{visible.map((item) => <button type="button" key={item.id} onClick={() => { setLineup(placePlayer(lineup, slot[0], item.id, selectableIds)); setNotice(`${item.name} placed at ${slot[1]}.`); setQuery(''); document.getElementById(`slot-${slot[0]}`)?.focus(); }}><span className="shirt-number">{item.shirtNumber}</span><span>{item.name}</span><span aria-hidden="true">+</span></button>)}{!visible.length && <p>No unselected players match your search.</p>}</div>
            </div>
          </>}
        </section>
      </div>
    </main>
  </div>;
}
