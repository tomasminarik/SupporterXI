'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { formations, roles, rolesForFamily, type Formation } from '../domain/catalogues';
import type { PublicPlayer } from '../domain/featured-fixture';
import type { Lineup } from '../domain/lineup';
import { assignRole, changeFormation, clearLineup, formationFor, movePlayer, placePlayer, removePlayer } from '../domain/lineup';
import Notice from './notice';
import PitchStage from './pitch-stage';
import { fieldPercent, markerLabel, placeLabels, positionNoun, projectSlot, shortNames, type LabelBox, type Placement } from './pitch-geometry';
import './lineup-editor.css';

type Slot = Formation['slots'][number];
type Dragged = { kind: 'player' | 'slot'; id: string; x: number; y: number; over: string | null };
type Change = { target: Formation; state: Lineup; leaving: string[]; clearedRoles: string[] };

export default function LineupEditor({ lineup, players, onChange }: { lineup: Lineup; players: readonly PublicPlayer[]; onChange: (state: Lineup) => void }) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [menuSlot, setMenuSlot] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const squadHeading = useRef<HTMLHeadingElement>(null);
  const squadSection = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const formationButton = useRef<HTMLButtonElement>(null);
  const hoverOrigin = useRef<{ x: number; y: number } | null>(null);
  const hoverArmed = useRef(false);
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
  // While the formation picker previews a formation, the pitch shows it.
  const previewTarget = formations.find((item) => item.id === previewId && item.id !== lineup.formationId);
  const preview = previewTarget ? describeChange(previewTarget) : null;
  const shown = preview?.state ?? lineup;
  const shownFormation = formationFor(shown);
  const shownOccupant = (slotId: string) => byId(shown.slots[slotId]?.playerId);

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

  // Close the formation picker, without changing anything, on a click elsewhere.
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointer = (event: PointerEvent) => {
      const element = event.target as Element;
      if (!pickerRef.current?.contains(element) && !formationButton.current?.contains(element)) { setPickerOpen(false); setPreviewId(null); }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
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
  }, [shown, players]);

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

  // Formation changes are previewed on the real pitch before they are committed.
  function describeChange(next: Formation): Change {
    const result = changeFormation(lineup, next);
    const kept = new Set(Object.values(result.state.slots).flatMap((entry) => entry ? [entry.playerId] : []));
    const leaving = Object.values(lineup.slots).flatMap((entry) => entry && !kept.has(entry.playerId) ? [byId(entry.playerId)?.name ?? 'Unknown player'] : []);
    const clearedRoles = (formation?.slots ?? []).flatMap((slot) => {
      const entry = lineup.slots[slot[0]];
      if (!entry?.roleId || !kept.has(entry.playerId)) return [];
      const after = Object.values(result.state.slots).find((item) => item?.playerId === entry.playerId);
      return after?.roleId ? [] : [`${byId(entry.playerId)?.name} (${roles.find((role) => role.id === entry.roleId)?.name})`];
    });
    return { target: next, state: result.state, leaving, clearedRoles };
  }
  // Hover previews only after the mouse really moves, so a panel opening under a
  // resting pointer never previews a formation nobody pointed at.
  function hoverPreview(event: ReactPointerEvent, id: string | null) {
    if (event.pointerType !== 'mouse') return;
    if (!hoverArmed.current) {
      const origin = hoverOrigin.current ?? (hoverOrigin.current = { x: event.clientX, y: event.clientY });
      if (Math.abs(event.clientX - origin.x) + Math.abs(event.clientY - origin.y) < 4) return;
      hoverArmed.current = true;
    }
    setPreviewId(id);
  }
  function openPicker(from?: { x: number; y: number }) {
    hoverOrigin.current = from ?? null; hoverArmed.current = false;
    resetSelection();
    setPickerOpen(true);
    requestAnimationFrame(() => pickerRef.current?.querySelector<HTMLElement>('[aria-pressed=true], button')?.focus());
  }
  function closePicker(focusButton = true) {
    setPickerOpen(false); setPreviewId(null);
    if (focusButton) requestAnimationFrame(() => formationButton.current?.focus());
  }
  function chooseFormation(next: Formation) {
    if (next.id === lineup.formationId) return closePicker();
    // Touch has no hover: the first tap previews, the second commits.
    if (previewId !== next.id) { setPreviewId(next.id); return; }
    const change = describeChange(next);
    onChange(change.state);
    setQuery('');
    setNotice(`${next.name} selected. ${change.leaving.length} players left the XI; ${change.clearedRoles.length} roles cleared.`);
    closePicker();
  }
  function onPickerKey(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.stopPropagation(); closePicker(); return; }
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const options = [...(pickerRef.current?.querySelectorAll<HTMLElement>('.sx-chip') ?? [])];
    const index = options.indexOf(document.activeElement as HTMLElement);
    options[(index + keys[event.key] + options.length) % options.length]?.focus();
  }


  const heading = count === 11 && !target && !menu && !heldPlayer ? 'Your XI is complete'
    : menuPlayer ? `Replace ${short(menuPlayer)}`
    : target ? `Pick your ${positionNoun(target[4])}`
    : heldPlayer ? `Place ${short(heldPlayer)}`
    : 'Pick your XI';
  const unavailablePicked = Object.values(lineup.slots).some((entry) => entry && !selectableIds.includes(entry.playerId));

  const shadows = shownFormation?.slots.map(([id, , x, y]) => {
    const { left, top } = fieldPercent(x, y);
    const occupant = shownOccupant(id);
    const role = roles.find((item) => item.id === shown.slots[id]?.roleId);
    const width = occupant ? 48 + Math.max(short(occupant).length * 9.5, role ? role.name.length * 6.6 : 0) : 0;
    return occupant
      ? <div key={id} className="sx-shadow" data-side={placements.get(id)?.side ?? 'right'} style={{ left: `${left}%`, top: `${top + 8}%`, width }} />
      : <div key={id} className="sx-shadow sx-shadow-empty" style={{ left: `${left}%`, top: `${top}%` }} />;
  });

  const groups = [['Back four', '4'], ['Back three', '3'], ['Back five', '5']].map(([label, digit]) => ({ label, items: formations.filter((item) => item.name.startsWith(digit)) }));
  const toolbar = <>
    <button ref={formationButton} type="button" className="sx-formation" aria-expanded={pickerOpen} aria-controls="formation-picker" aria-label={formation ? `Formation: ${formation.name}. Change formation` : 'Choose a formation'} onClick={(event) => pickerOpen ? closePicker() : openPicker(event.detail ? { x: event.clientX, y: event.clientY } : undefined)}>
      {(preview?.target ?? formation)?.name ?? 'Choose formation'}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l7 7 7-7" /></svg>
    </button>
    {pickerOpen && <div ref={pickerRef} id="formation-picker" className="sx-picker" role="group" aria-label="Choose a formation" onKeyDown={onPickerKey} onPointerLeave={(event) => { if (hoverArmed.current) hoverPreview(event, null); }}>
      <div className="sx-picker-groups">
        {groups.map((group) => <div key={group.label} className="sx-picker-group"><h3>{group.label}</h3><div className="sx-chips">
          {group.items.map((item) => <button key={item.id} type="button" className="sx-chip" aria-pressed={item.id === lineup.formationId} data-preview={item.id === previewId && item.id !== lineup.formationId ? 'true' : undefined}
            onPointerMove={(event) => { if (previewId !== item.id) hoverPreview(event, item.id); }} onFocus={() => setPreviewId(item.id)} onClick={() => chooseFormation(item)}>{item.name}</button>)}
        </div></div>)}
      </div>
      <p className="sx-picker-note" aria-live="polite">{!preview ? `Current: ${formation?.name ?? 'none'}. Hover or use the arrow keys to preview a formation on the pitch.`
        : <>{preview.leaving.length ? <><strong>Leaves your XI:</strong> {preview.leaving.join(', ')}. </> : null}{preview.clearedRoles.length ? <><strong>Roles cleared:</strong> {preview.clearedRoles.join(', ')}. </> : null}{!preview.leaving.length && !preview.clearedRoles.length ? 'Everyone keeps their place. ' : ''}Click or press Enter to use {preview.target.name}; Escape keeps {formation?.name ?? 'the current formation'}.</>}</p>
    </div>}
  </>;

  return <div ref={editorRef} className={preview ? 'sx-editor sx-previewing' : 'sx-editor'} onKeyDown={onKeyDown}>
    <p className="sr-only" role="status">{notice}</p>
    <PitchStage toolbar={toolbar} shadows={shadows} menu={menu && menuPlayer && <PillMenu ref={menuRef} short={short(menuPlayer)} slot={menu} lineup={lineup} player={menuPlayer} onClose={closeMenu}
        onRole={(roleId) => { onChange(assignRole(lineup, menu[0], roleId)); setNotice(roleId ? `Role set: ${roles.find((role) => role.id === roleId)?.name}.` : 'Role removed.'); }}
        onRemove={() => { onChange(removePlayer(lineup, menu[0])); setNotice(`${menuPlayer.name} removed. The position’s role is cleared.`); closeMenu(); }} />}>
      {shownFormation?.slots.map((slot) => {
        const [id, abbreviation, x, y] = slot;
        const occupant = shownOccupant(id);
        const role = roles.find((item) => item.id === shown.slots[id]?.roleId);
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
          <span className="sx-pill-body"><span className="sx-no">{occupant.shirtNumber ?? '–'}</span><span className="sx-name">{short(occupant)}</span></span>
          {(role || unavailable) && <span className="sx-tags">{role && <span className="sx-role">{role.name}</span>}{unavailable && <span className="sx-role sx-flag">Unavailable</span>}</span>}
        </button>;
      })}
    </PitchStage>

    {dragged && draggedPlayer && <div className="sx-ghost" aria-hidden="true" style={{ left: dragged.x, top: dragged.y }}><span className="sx-pill-body"><span className="sx-no">{draggedPlayer.shirtNumber ?? '–'}</span><span className="sx-name">{short(draggedPlayer)}</span></span></div>}

    {unavailablePicked && <Notice title="Some selected players are now unavailable.">They can stay in this XI, but cannot be added again after removal.</Notice>}

    <section ref={squadSection} className="sx-squad" aria-labelledby="squad-title">
      <div className="sx-squad-head">
        <h2 id="squad-title" ref={squadHeading} tabIndex={-1}>{heading}</h2>
        {heldPlayer ? <span className="sx-count">Choose a position on the pitch</span> : <span className="sx-count sx-count-total">{unused.length} players not picked</span>}
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

  </div>;
}

type MenuProps = {
  slot: Slot; lineup: Lineup; player: PublicPlayer; short: string; ref: React.RefObject<HTMLDivElement | null>;
  onClose: () => void; onRole: (roleId: string | null) => void; onRemove: () => void;
};
function PillMenu({ slot, lineup, player, short, ref, onClose, onRole, onRemove }: MenuProps) {
  const [id, abbreviation, , , family] = slot;
  const roleId = lineup.slots[id]?.roleId ?? null;
  const available = rolesForFamily(family);
  const titleId = useId();
  const options = [{ id: '', name: 'No role', shortDefinition: '' }, ...available];
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
    <div className="sx-menu-head"><h2 id={titleId} tabIndex={-1}>{abbreviation} · {player.name}</h2>
      <button type="button" className="sx-close" aria-label="Close" onClick={onClose}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg></button></div>
    {!player.selectable && <p className="sx-menu-note">Unavailable for new selections. Kept in your existing XI.</p>}
    {/* Roles are optional; each one carries its definition so the choice needs no second step. */}
    <p id={`${titleId}-roles`} className="sx-options-label">Role <span>optional</span></p>
    <div className="sx-options" role="radiogroup" aria-labelledby={`${titleId}-roles`}>
      {options.map((role) => <label key={role.id} className="sx-option">
        <input type="radio" name={`${titleId}-role`} value={role.id} checked={(roleId ?? '') === role.id} onChange={() => onRole(role.id || null)} aria-labelledby={`${titleId}-${role.id}`} aria-describedby={role.shortDefinition ? `${titleId}-${role.id}-d` : undefined} />
        <span className="sx-option-dot" aria-hidden="true" />
        <span className="sx-option-text"><span id={`${titleId}-${role.id}`} className="sx-option-name">{role.name}</span>{role.shortDefinition && <span id={`${titleId}-${role.id}-d`} className="sx-option-def">{role.shortDefinition}</span>}</span>
      </label>)}
    </div>
    <div className="sx-menu-foot"><button type="button" className="sx-secondary" onClick={onRemove}>Remove player</button><p>To replace {short}, pick a player from the squad.</p></div>
  </div>;
}
