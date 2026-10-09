'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { formations, roles, rolesForFamily, type Formation } from '../domain/catalogues';
import type { PublicPlayer } from '../domain/featured-fixture';
import type { Lineup } from '../domain/lineup';
import { assignRole, changeFormation, clearLineup, formationFor, movePlayer, placePlayer, removePlayer } from '../domain/lineup';
import PitchStage from './pitch-stage';
import { fieldPercent, markerLabel, placeLabels, positionNoun, projectSlot, shortNames, type LabelBox, type Placement } from './pitch-geometry';
import './lineup-editor.css';

type Slot = Formation['slots'][number];
type Dragged = { kind: 'player' | 'slot'; id: string; x: number; y: number; over: string | null };
type Proposal = { target: Formation; state: Lineup; leaving: string[]; clearedRoles: string[] };

export default function LineupEditor({ lineup, players, onChange }: { lineup: Lineup; players: readonly PublicPlayer[]; onChange: (state: Lineup) => void }) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [menuSlot, setMenuSlot] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const squadHeading = useRef<HTMLHeadingElement>(null);
  const squadSection = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [placements, setPlacements] = useState<ReadonlyMap<string, Placement>>(new Map());
  const names = useMemo(() => shortNames(players), [players]);
  const short = (player: PublicPlayer) => names.get(player.id) ?? player.name;
  const [dragged, setDragged] = useState<Dragged | null>(null);
  const dropRef = useRef<(drag: Dragged) => void>(() => {});
  const suppressClick = useRef(false);

  const formation = formationFor(lineup);
  const selectableIds = players.filter((player) => player.selectable).map((player) => player.id);
  const byId = (id: string | undefined) => players.find((item) => item.id === id);
  const occupantOf = (slotId: string) => byId(lineup.slots[slotId]?.playerId);
  const slotOf = (slotId: string | null) => formation?.slots.find((item) => item[0] === slotId);
  const pickedIds = new Set(Object.values(lineup.slots).flatMap((entry) => entry ? [entry.playerId] : []));
  const unused = players.filter((item) => item.selectable && !pickedIds.has(item.id));
  const needle = query.trim().toLocaleLowerCase();
  const visible = unused.filter((item) => `${item.shirtNumber ?? ''} ${item.name}`.toLocaleLowerCase().includes(needle));
  const count = pickedIds.size;
  const target = slotOf(selectedSlot);
  const menu = slotOf(menuSlot);
  const menuPlayer = menu && occupantOf(menu[0]);
  const heldPlayer = byId(selectedPlayer ?? undefined);

  // Close the pill menu when the pointer goes down anywhere else.
  useEffect(() => {
    if (!menuSlot) return;
    const onPointer = (event: PointerEvent) => {
      const element = event.target as Element;
      if (!menuRef.current?.contains(element) && !element.closest?.('.sx-marker, .sx-card')) setMenuSlot(null);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [menuSlot]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pickerOpen && !dialog.open) dialog.showModal();
    if (!pickerOpen && dialog.open) dialog.close();
  }, [pickerOpen]);

  // Measure the rendered pills and tags, then choose where each label sits.
  useLayoutEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const measure = () => {
      const boxes: LabelBox[] = [...root.querySelectorAll<HTMLElement>('.sx-marker')].map((element) => {
        const body = element.querySelector<HTMLElement>('.sx-pill-body');
        const id = element.dataset.slot!;
        return body ? { id, x: element.offsetLeft, y: element.offsetTop, pill: body.offsetWidth, tag: element.querySelector<HTMLElement>('.sx-tags')?.offsetWidth ?? 0 } : { id, x: element.offsetLeft, y: element.offsetTop, radius: 22 };
      });
      const next = placeLabels(boxes);
      setPlacements((previous) => [...next].every(([id, value]) => previous.get(id)?.side === value.side && previous.get(id)?.tag === value.tag) && previous.size === next.size ? previous : next);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [lineup, players]);

  const focusSlot = (slotId: string) => requestAnimationFrame(() => document.getElementById(`slot-${slotId}`)?.focus());
  function resetSelection() { setSelectedSlot(null); setSelectedPlayer(null); setMenuSlot(null); }

  function place(slot: Slot, player: PublicPlayer) {
    const replaced = occupantOf(slot[0]);
    onChange(placePlayer(lineup, slot[0], player.id, selectableIds));
    setNotice(`${player.name} placed at ${slot[1]}${replaced ? `, replacing ${replaced.name}` : ''}.`);
    resetSelection(); setQuery('');
    focusSlot(slot[0]);
  }
  function move(from: string, to: string) {
    const destination = slotOf(to);
    if (!destination) return;
    const moving = occupantOf(from);
    const other = occupantOf(to);
    onChange(movePlayer(lineup, from, to));
    setNotice(other ? `${moving?.name} and ${other.name} swapped.` : `${moving?.name} moved to ${destination[1]}.`);
    resetSelection();
    focusSlot(to);
  }

  function chooseSlot(slot: Slot) {
    const occupant = occupantOf(slot[0]);
    if (heldPlayer) return place(slot, heldPlayer);
    if (occupant) {
      const open = menuSlot !== slot[0];
      setMenuSlot(open ? slot[0] : null); setSelectedSlot(open ? slot[0] : null);
      if (open) requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true }));
      return;
    }
    if (selectedSlot === slot[0]) { resetSelection(); return; }
    setMenuSlot(null); setSelectedSlot(slot[0]);
    setNotice(`${slot[1]} selected. Pick your ${positionNoun(slot[4])} from the squad.`);
    // Lead keyboard and screen-reader users to the squad; keep the pitch where it is.
    requestAnimationFrame(() => {
      squadHeading.current?.focus({ preventScroll: true });
      squadSection.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    });
  }
  function chooseCard(player: PublicPlayer) {
    const slot = target ?? menu;
    if (slot) return place(slot, player);
    const holding = selectedPlayer !== player.id;
    setSelectedPlayer(holding ? player.id : null);
    setNotice(holding ? `${player.name} selected. Choose a position on the pitch.` : 'Selection cleared.');
  }
  function closeMenu() {
    const slotId = menuSlot;
    resetSelection();
    if (slotId) focusSlot(slotId);
  }
  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || pickerOpen) return;
    if (menuSlot) closeMenu();
    else if (selectedSlot || selectedPlayer) { resetSelection(); setNotice('Selection cleared.'); }
  }

  // Desktop drag and drop with the mouse: a squad card onto a position, or a pill
  // onto another position (move or swap). Click and keyboard remain the alternatives.
  function dropOn(drag: Dragged) {
    const slot = slotOf(drag.over);
    if (!slot) return;
    if (drag.kind === 'slot') { if (drag.id !== slot[0] && lineup.slots[drag.id]) move(drag.id, slot[0]); return; }
    const player = byId(drag.id);
    if (player?.selectable && !pickedIds.has(player.id)) place(slot, player);
  }
  // The window listeners outlive a render; always drop with the latest lineup.
  useLayoutEffect(() => { dropRef.current = dropOn; });
  function startDrag(event: ReactPointerEvent, kind: Dragged['kind'], id: string) {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    const startX = event.clientX;
    const startY = event.clientY;
    let current: Dragged | null = null;
    const nearest = (x: number, y: number) => {
      let best: string | null = null;
      let distance = 64;
      for (const marker of editorRef.current?.querySelectorAll<HTMLElement>('.sx-marker') ?? []) {
        const anchor = (marker.querySelector('.sx-no') ?? marker).getBoundingClientRect();
        const body = (marker.querySelector('.sx-pill-body') ?? marker).getBoundingClientRect();
        const inside = x >= body.left && x <= body.right && y >= body.top && y <= body.bottom;
        const gap = inside ? 0 : Math.hypot(x - (anchor.left + anchor.right) / 2, y - (anchor.top + anchor.bottom) / 2);
        if (gap < distance) { distance = gap; best = marker.dataset.slot ?? null; }
      }
      return best;
    };
    const onMove = (move: PointerEvent) => {
      if (!current && Math.hypot(move.clientX - startX, move.clientY - startY) < 6) return;
      current = { kind, id, x: move.clientX, y: move.clientY, over: nearest(move.clientX, move.clientY) };
      document.body.classList.add('sx-dragging');
      setDragged(current);
    };
    const finish = (commit: boolean) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('sx-dragging');
      if (!current) return;
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
      setDragged(null);
      if (commit) dropRef.current(current);
    };
    const onUp = () => finish(true);
    const onKey = (key: globalThis.KeyboardEvent) => { if (key.key === 'Escape') finish(false); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
  }
  const draggedPlayer = dragged && (dragged.kind === 'player' ? byId(dragged.id) : occupantOf(dragged.id));

  function pickFormation(next: Formation) {
    if (next.id === lineup.formationId) { setPickerOpen(false); return; }
    const result = changeFormation(lineup, next);
    const kept = new Set(Object.values(result.state.slots).flatMap((entry) => entry ? [entry.playerId] : []));
    const leaving = Object.values(lineup.slots).flatMap((entry) => entry && !kept.has(entry.playerId) ? [byId(entry.playerId)?.name ?? 'Unknown player'] : []);
    const clearedRoles = (formation?.slots ?? []).flatMap((slot) => {
      const entry = lineup.slots[slot[0]];
      if (!entry?.roleId || !kept.has(entry.playerId)) return [];
      const after = Object.values(result.state.slots).find((item) => item?.playerId === entry.playerId);
      return after?.roleId ? [] : [`${byId(entry.playerId)?.name} (${roles.find((role) => role.id === entry.roleId)?.name})`];
    });
    const change = { target: next, state: result.state, leaving, clearedRoles };
    if (leaving.length || clearedRoles.length) setProposal(change);
    else applyFormation(change);
  }
  function applyFormation(change: Proposal) {
    onChange(change.state);
    resetSelection(); setQuery(''); setProposal(null); setPickerOpen(false);
    setNotice(`${change.target.name} selected. ${change.leaving.length} players left the XI; ${change.clearedRoles.length} roles cleared.`);
  }

  const heading = count === 11 && !target && !menu && !heldPlayer ? 'Your XI is complete'
    : menuPlayer ? `Replace ${short(menuPlayer)}`
    : target ? `Pick your ${positionNoun(target[4])}`
    : heldPlayer ? `Place ${short(heldPlayer)}`
    : 'Pick your XI';
  const unavailablePicked = Object.values(lineup.slots).some((entry) => entry && !selectableIds.includes(entry.playerId));

  const shadows = formation?.slots.map(([id, , x, y]) => {
    const { left, top } = fieldPercent(x, y);
    const occupant = occupantOf(id);
    const role = roles.find((item) => item.id === lineup.slots[id]?.roleId);
    const width = occupant ? 48 + Math.max(short(occupant).length * 9.5, role ? role.name.length * 6.6 : 0) : 0;
    return occupant
      ? <div key={id} className="sx-shadow" data-side={placements.get(id)?.side ?? 'right'} style={{ left: `${left}%`, top: `${top + 8}%`, width }} />
      : <div key={id} className="sx-shadow sx-shadow-empty" style={{ left: `${left}%`, top: `${top}%` }} />;
  });

  const toolbar = <button type="button" className="sx-formation" aria-haspopup="dialog" aria-label={formation ? `Formation: ${formation.name}. Change formation` : 'Choose a formation'} onClick={() => { setMenuSlot(null); setPickerOpen(true); }}>
    {formation?.name ?? 'Choose formation'}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l7 7 7-7" /></svg>
  </button>;

  return <div ref={editorRef} className="sx-editor" onKeyDown={onKeyDown}>
    <p className="sr-only" role="status">{notice}</p>
    <PitchStage toolbar={toolbar} shadows={shadows} menu={menu && menuPlayer && <PillMenu ref={menuRef} short={short(menuPlayer)} slot={menu} lineup={lineup} formation={formation!} player={menuPlayer} occupantOf={occupantOf} onClose={closeMenu}
        onRole={(roleId) => { onChange(assignRole(lineup, menu[0], roleId)); setNotice(roleId ? `Role set: ${roles.find((role) => role.id === roleId)?.name}.` : 'Role removed.'); }}
        onMove={(to) => move(menu[0], to)}
        onRemove={() => { onChange(removePlayer(lineup, menu[0])); setNotice(`${menuPlayer.name} removed. The position’s role is cleared.`); closeMenu(); }} />}>
      {formation?.slots.map((slot) => {
        const [id, abbreviation, x, y] = slot;
        const occupant = occupantOf(id);
        const role = roles.find((item) => item.id === lineup.slots[id]?.roleId);
        const point = projectSlot(x, y);
        const style = { '--x': point.x, '--y': point.y, '--fx': 6 + x * 0.88, '--fy': 4 + (100 - y) * 0.92 } as React.CSSProperties;
        const selected = selectedSlot === id;
        const common = {
          id: `slot-${id}`, type: 'button' as const, style, 'aria-pressed': selected, 'data-slot': id,
          onClick: () => { if (!suppressClick.current) chooseSlot(slot); },
          'data-drop': dragged?.over === id ? 'true' : undefined,
        };
        if (!occupant) return <button key={id} {...common} className={`sx-marker sx-empty${heldPlayer ? ' sx-target' : ''}`} aria-label={`${abbreviation}: Empty`}>{markerLabel(abbreviation)}</button>;
        const unavailable = !occupant.selectable;
        const placement = placements.get(id);
        return <button key={id} {...common} data-side={placement?.side ?? 'right'} data-tag={placement?.tag ?? 'below'} className={`sx-marker sx-pill${unavailable ? ' sx-unavailable' : ''}`} aria-expanded={menuSlot === id} aria-label={`${abbreviation}: ${occupant.name}${role ? `, ${role.name}` : ''}${unavailable ? ', unavailable' : ''}`}
          onPointerDown={(event) => startDrag(event, 'slot', id)}>
          <span className="sx-pill-body"><span className="sx-no">{occupant.shirtNumber ?? '–'}</span>{short(occupant)}</span>
          {(role || unavailable) && <span className="sx-tags">{role && <span className="sx-role">{role.name}</span>}{unavailable && <span className="sx-role sx-flag">Unavailable</span>}</span>}
        </button>;
      })}
    </PitchStage>

    {dragged && draggedPlayer && <div className="sx-ghost" aria-hidden="true" style={{ left: dragged.x, top: dragged.y }}><span className="sx-pill-body"><span className="sx-no">{draggedPlayer.shirtNumber ?? '–'}</span>{short(draggedPlayer)}</span></div>}

    {unavailablePicked && <p className="sx-notice" role="status">Some selected players are now unavailable. They can stay in this XI, but cannot be added again after removal.</p>}

    <section ref={squadSection} className="sx-squad" aria-labelledby="squad-title">
      <div className="sx-squad-head">
        <h2 id="squad-title" ref={squadHeading} tabIndex={-1}>{heading}</h2>
        <span className="sx-count">{heldPlayer ? 'Choose a position on the pitch' : `${unused.length} players not picked`}</span>
        <button type="button" className="sx-quiet" disabled={!count} onClick={() => { onChange(clearLineup(lineup)); resetSelection(); setNotice('XI cleared. Formation kept.'); }}>Clear XI</button>
        <label className="sx-search"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input type="search" aria-label="Search players" placeholder="Name or number" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      </div>
      {visible.length > 0 && <div className="sx-cards" role="list" aria-label="Players not picked">
        {visible.map((player) => <div role="listitem" key={player.id}>
          <button type="button" className="sx-card" aria-label={`${player.shirtNumber ?? ''} ${player.name}`.trim()} aria-pressed={selectedPlayer === player.id} data-dragging={dragged?.kind === 'player' && dragged.id === player.id ? 'true' : undefined}
            onPointerDown={(event) => startDrag(event, 'player', player.id)}
            onClick={() => { if (!suppressClick.current) chooseCard(player); }}>
            <span className="sx-card-no" aria-hidden="true">{player.shirtNumber ?? '–'}</span><span className="sx-card-name" aria-hidden="true">{short(player)}</span>
          </button>
        </div>)}
      </div>}
      {!visible.length && <p className="sx-empty-list">{unused.length ? 'No players match your search.' : 'No eligible players left to pick.'}</p>}
    </section>

    <dialog ref={dialogRef} className="sx-dialog" aria-labelledby="formation-title" onClose={() => { setPickerOpen(false); setProposal(null); }}>
      {proposal ? <div className="sx-confirm">
        <h2 id="formation-title">Change to {proposal.target.name}?</h2>
        {proposal.leaving.length > 0 && <p><strong>Leaving your XI:</strong> {proposal.leaving.join(', ')}</p>}
        {proposal.clearedRoles.length > 0 && <p><strong>Roles cleared:</strong> {proposal.clearedRoles.join(', ')}</p>}
        <p className="sx-muted">Players in matching positions keep their place.</p>
        <div className="sx-dialog-actions">
          <button type="button" className="sx-secondary" onClick={() => setProposal(null)}>Keep {formation?.name ?? 'current formation'}</button>
          <button type="button" className="sx-primary" onClick={() => applyFormation(proposal)}>Change to {proposal.target.name}</button>
        </div>
      </div> : <>
        <div className="sx-dialog-head"><h2 id="formation-title">Choose a formation</h2><button type="button" className="sx-close" aria-label="Close" onClick={() => setPickerOpen(false)}>×</button></div>
        <div className="sx-formations">
          {formations.map((item) => <button type="button" key={item.id} className="sx-formation-option" aria-pressed={item.id === lineup.formationId} onClick={() => pickFormation(item)}>
            <FormationThumb formation={item} /><span>{item.name}</span>{item.id === lineup.formationId && <span className="sx-current">Current</span>}
          </button>)}
        </div>
      </>}
    </dialog>
  </div>;
}

function FormationThumb({ formation }: { formation: Formation }) {
  return <svg aria-hidden="true" viewBox="0 0 105 68" className="sx-thumb">
    <rect x="1" y="1" width="103" height="66" /><path d="M52.5 1V67M1 17H17V51H1M104 17H88V51H104" /><circle cx="52.5" cy="34" r="9" />
    {formation.slots.map(([id, , x, y]) => { const p = fieldPercent(x, y); return <circle key={id} className="dot" cx={p.left * 1.05} cy={p.top * 0.68} r="3.2" />; })}
  </svg>;
}

type MenuProps = {
  slot: Slot; lineup: Lineup; formation: Formation; player: PublicPlayer; short: string; ref: React.RefObject<HTMLDivElement | null>;
  occupantOf: (slotId: string) => PublicPlayer | undefined; onClose: () => void;
  onRole: (roleId: string | null) => void; onMove: (to: string) => void; onRemove: () => void;
};
function PillMenu({ slot, lineup, formation, player, short, ref, occupantOf, onClose, onRole, onMove, onRemove }: MenuProps) {
  const [id, abbreviation, , , family] = slot;
  const roleId = lineup.slots[id]?.roleId ?? null;
  const available = rolesForFamily(family);
  const titleId = useId();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  // Open beside the pill, inside the pitch area, so the squad row stays reachable.
  useLayoutEffect(() => {
    const menu = ref.current;
    const marker = document.getElementById(`slot-${id}`);
    const layer = menu?.parentElement;
    if (!menu || !marker || !layer) return;
    const place = () => {
      const area = layer.getBoundingClientRect();
      const target = marker.querySelector('.sx-pill-body')?.parentElement?.getBoundingClientRect() ?? marker.getBoundingClientRect();
      const scale = area.width / 1160;
      let left = target.right - area.left + 16;
      if (left + menu.offsetWidth > area.width) left = target.left - area.left - 16 - menu.offsetWidth;
      const ceiling = 252 * scale + 8;
      const top = Math.max(ceiling, Math.min((target.top + target.bottom) / 2 - area.top - menu.offsetHeight / 2, area.height - menu.offsetHeight));
      setPosition((previous) => previous?.left === left && previous.top === top ? previous : { left, top });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(menu);
    observer.observe(layer);
    return () => observer.disconnect();
  }, [id, ref]);
  return <div ref={ref} className="sx-menu" role="group" aria-labelledby={titleId}
    style={{ '--mx': `${position?.left ?? 0}px`, '--my': `${position?.top ?? 0}px`, visibility: position ? undefined : 'hidden' } as React.CSSProperties}>
    <div className="sx-menu-head"><h2 id={titleId} tabIndex={-1}>{abbreviation} · {player.name}</h2><button type="button" className="sx-close" aria-label="Close" onClick={onClose}>×</button></div>
    {!player.selectable && <p className="sx-muted">Unavailable for new selections. Kept in your existing XI.</p>}
    <label className="sx-field-label">Role<select value={roleId ?? ''} onChange={(event) => onRole(event.target.value || null)}><option value="">No role</option>{available.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
    <p className="sx-muted">{roles.find((role) => role.id === roleId)?.shortDefinition ?? 'Roles are optional. Choose one to describe this player’s behaviour.'}</p>
    <details className="sx-guide"><summary>Role definitions</summary>{available.map((role) => <p key={role.id}><strong>{role.name}</strong><br />{role.shortDefinition}</p>)}</details>
    <label className="sx-field-label">Move or swap to<select value="" onChange={(event) => { if (event.target.value) onMove(event.target.value); }}><option value="">Choose a position</option>{formation.slots.filter((item) => item[0] !== id).map((item) => <option key={item[0]} value={item[0]}>{item[1]} — {occupantOf(item[0])?.name ?? 'Empty'}</option>)}</select></label>
    <button type="button" className="sx-secondary sx-wide" onClick={onRemove}>Remove player</button>
    <p className="sx-muted sx-hint">To replace {short}, pick a player from the squad.</p>
  </div>;
}
