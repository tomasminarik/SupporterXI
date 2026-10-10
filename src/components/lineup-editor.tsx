'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { formations, roles, rolesForFamily, type Formation } from '../domain/catalogues';
import type { PublicPlayer } from '../domain/featured-fixture';
import type { Lineup } from '../domain/lineup';
import { track } from '../analytics/analytics';
import { assignRole, changeFormation, clearLineup, formationFor, movePlayer, placePlayer, removePlayer } from '../domain/lineup';
import { Button, CloseButton } from '../design/button';
import { crisp, ghostOut, glideFrom, reducedMotion } from '../design/motion';
import { OptionList } from '../design/option-list';
import { PillBody, RoleTag } from '../design/player-pill';
import { Tile } from '../design/tile';
import { durations } from '../design/tokens';
import Notice from '../design/notice';
import PitchStage from './pitch-stage';
import { fieldPercent, markerLabel, placeLabels, portraitSpot, positionNoun, projectSlot, shortNames, type LabelBox, type Placement } from './pitch-geometry';
import './lineup-editor.css';

type Slot = Formation['slots'][number];
type Dragged = { kind: 'player' | 'slot'; id: string; x: number; y: number; over: string | null };
type Change = { target: Formation; state: Lineup; leaving: string[]; clearedRoles: string[] };

export default function LineupEditor({ lineup, players, locked = false, onChange }: { lineup: Lineup; players: readonly PublicPlayer[]; locked?: boolean; onChange: (state: Lineup) => void }) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [menuSlot, setMenuSlot] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  // Touch layout only: the squad sheet opened from a player's sheet, and a pending move.
  const [replacing, setReplacing] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const squadHeading = useRef<HTMLHeadingElement>(null);
  const squadSection = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const formationButton = useRef<HTMLButtonElement>(null);
  const hoverOrigin = useRef<{ x: number; y: number } | null>(null);
  const hoverArmed = useRef(false);
  const lastPointer = useRef('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [placements, setPlacements] = useState<ReadonlyMap<string, Placement>>(new Map());
  const names = useMemo(() => shortNames(players), [players]);
  const short = (player: PublicPlayer) => names.get(player.id) ?? player.name;
  const [dragged, setDragged] = useState<Dragged | null>(null);
  const dropRef = useRef<(drag: Dragged) => void>(() => {});
  const suppressClick = useRef(false);
  // Motion: the first second is the arrival wave; Clear XI replays a shorter one.
  const [wave, setWave] = useState<'arrive' | 'clear' | null>('arrive');
  const pendingGlide = useRef<Map<string, { x: number; y: number }> | null>(null);
  const cardSpots = useRef(new Map<string, { x: number; y: number }>());
  const bodyOf = (slotId: string) => document.getElementById(`slot-${slotId}`)?.querySelector<HTMLElement>('.sx-pill-body');
  const lift: Keyframe[] = [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-18px) scale(.94)' }];
  const leave = (slotId: string, delay = 0) => ghostOut(bodyOf(slotId), editorRef.current, lift, { delay, inside: { className: 'sx-pill', side: document.getElementById(`slot-${slotId}`)?.dataset.side } });
  useEffect(() => { const timer = setTimeout(() => setWave(null), 1100); return () => clearTimeout(timer); }, []);

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
      if (!menuRef.current?.contains(element) && !element.closest?.('.sx-marker, .sx-squad')) { setMenuSlot(null); setReplacing(false); }
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
  function resetSelection() { setSelectedSlot(null); setSelectedPlayer(null); setMenuSlot(null); setReplacing(false); setMoving(null); }
  // Below 900px the squad and the player menu are sheets fixed to the bottom of the screen,
  // so the chosen position is brought into the part of the pitch that stays visible above them.
  const touchLayout = () => window.matchMedia('(max-width: 899px)').matches;
  function keepInView(slotId: string) {
    const box = document.getElementById(`slot-${slotId}`)?.getBoundingClientRect();
    if (!box || (box.top > 70 && box.bottom < window.innerHeight * 0.36)) return;
    window.scrollBy({ top: box.top - window.innerHeight * 0.18, behavior: reducedMotion() ? 'instant' : 'smooth' });
  }

  function place(slot: Slot, player: PublicPlayer, dropped = false) {
    const replaced = occupantOf(slot[0]);
    if (!dropped) ghostOut(editorRef.current?.querySelector(`[data-card="${player.id}"] .sx-card`), editorRef.current, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.6)' }], { duration: durations.quick });
    if (replaced) leave(slot[0]);
    if (!replaced && pickedIds.size === 10) setTimeout(cheer, 260);
    // Usage only: that a lineup was begun or finished, never who is in it (src/analytics/analytics.ts).
    if (!replaced && pickedIds.size === 0) track('lineup_started');
    if (!replaced && pickedIds.size === 10) track('lineup_completed');
    onChange(placePlayer(lineup, slot[0], player.id, selectableIds));
    setNotice(`${player.name} placed at ${slot[1]}${replaced ? `, replacing ${replaced.name}` : ''}.`);
    resetSelection(); setQuery('');
    focusSlot(slot[0]);
  }
  // The eleventh player: a quick pulse runs through the XI from the goalkeeper forward.
  function cheer() {
    if (reducedMotion()) return;
    for (const marker of editorRef.current?.querySelectorAll<HTMLElement>('.sx-pill') ?? []) {
      marker.querySelector('.sx-pill-body')?.animate([{ scale: 1 }, { scale: 1.14, boxShadow: '0 0 0 6px rgba(255,255,255,.35), 0 8px 14px rgba(0,0,0,.4)' }, { scale: 1 }], { duration: durations.entrance, delay: Number(marker.style.getPropertyValue('--i')) * 35, easing: crisp });
    }
  }
  function move(from: string, to: string, droppedAt?: { x: number; y: number }) {
    const destination = slotOf(to);
    if (!destination) return;
    const moving = occupantOf(from);
    const other = occupantOf(to);
    const corner = (slotId: string) => { const box = bodyOf(slotId)?.getBoundingClientRect(); return box && { x: box.left, y: box.top }; };
    const glides = new Map<string, { x: number; y: number }>();
    const start = droppedAt ? { x: droppedAt.x - 17, y: droppedAt.y - 16 } : corner(from);
    if (moving && start) glides.set(moving.id, start);
    const otherStart = other && corner(to);
    if (other && otherStart) glides.set(other.id, otherStart);
    pendingGlide.current = glides;
    onChange(movePlayer(lineup, from, to));
    setNotice(other ? `${moving?.name} and ${other.name} swapped.` : `${moving?.name} moved to ${destination[1]}.`);
    resetSelection();
    focusSlot(to);
  }

  // A locked XI is still read position by position; nothing on it opens or moves.
  const lockedNotice = 'This XI is locked: the match has kicked off.';
  const [wasLocked, setWasLocked] = useState(locked);
  if (wasLocked !== locked) {
    setWasLocked(locked);
    if (locked) { setSelectedSlot(null); setSelectedPlayer(null); setMenuSlot(null); setReplacing(false); setMoving(null); setPickerOpen(false); setPreviewId(null); setDragged(null); setNotice(lockedNotice); }
  }
  function chooseSlot(slot: Slot) {
    if (locked) { setNotice(''); requestAnimationFrame(() => setNotice(lockedNotice)); return; }
    const occupant = occupantOf(slot[0]);
    if (moving) { if (moving === slot[0]) { resetSelection(); setNotice('Move cancelled.'); } else move(moving, slot[0]); return; }
    if (heldPlayer) return place(slot, heldPlayer);
    if (occupant) {
      const open = menuSlot !== slot[0];
      setMenuSlot(open ? slot[0] : null); setSelectedSlot(open ? slot[0] : null); setReplacing(false);
      if (open) requestAnimationFrame(() => { menuRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true }); if (touchLayout()) keepInView(slot[0]); });
      return;
    }
    if (selectedSlot === slot[0]) { resetSelection(); return; }
    setMenuSlot(null); setSelectedSlot(slot[0]);
    setNotice(`${slot[1]} selected. Pick your ${positionNoun(slot[4])} from the squad.`);
    // Lead keyboard and screen-reader users to the squad; keep the pitch where it is.
    requestAnimationFrame(() => {
      squadHeading.current?.focus({ preventScroll: true });
      if (touchLayout()) keepInView(slot[0]);
      else squadSection.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
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
    else if (selectedSlot || selectedPlayer || moving) { resetSelection(); setNotice('Selection cleared.'); }
  }

  // Desktop drag and drop with the mouse: a squad card onto a position, or a pill
  // onto another position (move or swap). Click and keyboard remain the alternatives.
  function dropOn(drag: Dragged) {
    const slot = slotOf(drag.over);
    if (!slot) return;
    if (drag.kind === 'slot') { if (!locked && drag.id !== slot[0] && lineup.slots[drag.id]) move(drag.id, slot[0], { x: drag.x, y: drag.y }); return; }
    if (locked) return;
    const player = byId(drag.id);
    if (player?.selectable && !pickedIds.has(player.id)) place(slot, player, true);
  }
  // The window listeners outlive a render; always drop with the latest lineup.
  useLayoutEffect(() => { dropRef.current = dropOn; });
  // After a move or swap the pills glide from where they were. Squad cards slide to close a gap.
  useLayoutEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const glides = pendingGlide.current;
    pendingGlide.current = null;
    for (const [playerId, before] of glides ?? []) glideFrom(root.querySelector(`.sx-pill-body[data-player="${playerId}"]`), before);
    const spots = new Map<string, { x: number; y: number }>();
    const still = reducedMotion();
    for (const item of root.querySelectorAll<HTMLElement>('[data-card]')) {
      const spot = { x: item.offsetLeft, y: item.offsetTop };
      const before = cardSpots.current.get(item.dataset.card!);
      const dx = before ? before.x - spot.x : 0;
      const dy = before ? before.y - spot.y : 0;
      if (!still && (dx || dy) && Math.abs(dx) < 800) item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: durations.standard, easing: crisp });
      spots.set(item.dataset.card!, spot);
    }
    cardSpots.current = spots;
  });
  function startDrag(event: ReactPointerEvent, kind: Dragged['kind'], id: string) {
    if (locked || event.button !== 0 || event.pointerType === 'touch') return;
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
    requestAnimationFrame(() => {
      pickerRef.current?.querySelector<HTMLElement>('[aria-pressed=true], button')?.focus({ preventScroll: true });
      // In the touch layout the picker is a sheet; show the top of the pitch above it.
      if (touchLayout()) { const top = editorRef.current?.querySelector('.sx-overlay')?.getBoundingClientRect().top ?? 0; window.scrollBy({ top: top - 12, behavior: reducedMotion() ? 'instant' : 'smooth' }); }
    });
  }
  function closePicker(focusButton = true) {
    setPickerOpen(false); setPreviewId(null);
    if (focusButton) requestAnimationFrame(() => formationButton.current?.focus());
  }
  function chooseFormation(next: Formation) {
    if (next.id === lineup.formationId) return closePicker();
    const change = describeChange(next);
    // Mouse and keyboard preview by hovering or arrowing, so a click on the previewed formation commits.
    // Touch has no hover: a tap applies a change that costs nothing, and previews one that would
    // drop players or roles so that it can be confirmed.
    const costly = change.leaving.length + change.clearedRoles.length > 0;
    if (previewId !== next.id && (lastPointer.current !== 'touch' || costly)) { setPreviewId(next.id); return; }
    onChange(change.state);
    setQuery('');
    setNotice(`${next.name} selected. ${change.leaving.length} players left the XI; ${change.clearedRoles.length} roles cleared.`);
    closePicker();
  }
  function onPickerKey(event: KeyboardEvent) {
    lastPointer.current = '';
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
  const sheetOpen = menu ? replacing : !!target;
  const movingPlayer = moving ? occupantOf(moving) : undefined;
  const unavailablePicked = Object.values(lineup.slots).some((entry) => entry && !selectableIds.includes(entry.playerId));

  const shadows = shownFormation?.slots.map(([id, , x, y]) => {
    const { left, top } = fieldPercent(x, y);
    const occupant = shownOccupant(id);
    const role = roles.find((item) => item.id === shown.slots[id]?.roleId);
    const width = occupant ? 48 + Math.max(short(occupant).length * 9.5, role ? role.name.length * 6.6 : 0) : 0;
    return occupant
      ? <div key={`${id}:${occupant.id}`} className="sx-shadow" data-side={placements.get(id)?.side ?? 'right'} style={{ left: `${left}%`, top: `${top + 8}%`, width }} />
      : <div key={id} className="sx-shadow sx-shadow-empty" style={{ left: `${left}%`, top: `${top}%` }} />;
  });

  // Waves run from the goalkeeper forward.
  const waveOrder = new Map([...(shownFormation?.slots ?? [])].sort((a, b) => a[3] - b[3] || a[2] - b[2]).map((slot, index) => [slot[0], index]));
  const groups = [['Back four', '4'], ['Back three', '3'], ['Back five', '5']].map(([label, digit]) => ({ label, items: formations.filter((item) => item.name.startsWith(digit)) }));
  const toolbar = <>
    <button ref={formationButton} type="button" className="sx-formation" disabled={locked} aria-expanded={pickerOpen} aria-controls="formation-picker" aria-label={locked && formation ? `Formation: ${formation.name}` : formation ? `Formation: ${formation.name}. Change formation` : 'Choose a formation'} onClick={(event) => pickerOpen ? closePicker() : openPicker(event.detail ? { x: event.clientX, y: event.clientY } : undefined)}>
      {(preview?.target ?? formation)?.name ?? 'Choose formation'}{!locked && <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l7 7 7-7" /></svg>}
    </button>
    {pickerOpen && <div ref={pickerRef} id="formation-picker" className="sx-panel sx-picker" role="group" aria-label="Choose a formation" onKeyDown={onPickerKey} onPointerLeave={(event) => { if (hoverArmed.current) hoverPreview(event, null); }}>
      <div className="sx-picker-groups">
        {groups.map((group) => <div key={group.label} className="sx-picker-group"><h3 className="sx-label">{group.label}</h3><div className="sx-chips">
          {group.items.map((item) => <Tile key={item.id} className="sx-chip" pressed={item.id === lineup.formationId} data-preview={item.id === previewId && item.id !== lineup.formationId ? 'true' : undefined}
            onPointerDown={(event) => { lastPointer.current = event.pointerType; }} onPointerMove={(event) => { if (previewId !== item.id) hoverPreview(event, item.id); }} onFocus={() => { if (lastPointer.current !== 'touch') setPreviewId(item.id); }} onClick={() => chooseFormation(item)}>{item.name}</Tile>)}
        </div></div>)}
      </div>
      <p className="sx-picker-note" aria-live="polite">{!preview ? <><span className="sx-pointer-only">Current: {formation?.name ?? 'none'}. Hover or use the arrow keys to preview a formation on the pitch.</span><span className="sx-touch-only">Tap a formation. You will be asked first if it would drop players or roles.</span></>
        : <>{preview.leaving.length ? <><strong>Leaves your XI:</strong> {preview.leaving.join(', ')}. </> : null}{preview.clearedRoles.length ? <><strong>Roles cleared:</strong> {preview.clearedRoles.join(', ')}. </> : null}{!preview.leaving.length && !preview.clearedRoles.length ? 'Everyone keeps their place. ' : ''}<span className="sx-pointer-only">Click or press Enter to use {preview.target.name}; Escape keeps {formation?.name ?? 'the current formation'}.</span></>}</p>
      {/* Always laid out in the touch sheet, so the chips never move under a finger when a preview starts. */}
      <div className="sx-picker-confirm sx-touch-only" data-idle={preview ? undefined : 'true'}><Button disabled={!preview} onClick={() => setPreviewId(null)}>Keep {formation?.name}</Button><Button variant="primary" disabled={!preview} onClick={() => { if (preview) chooseFormation(preview.target); }}>Use {preview?.target.name ?? 'formation'}</Button></div>
    </div>}
  </>;

  return <div ref={editorRef} className={`sx-editor${locked ? ' sx-locked' : ''}${preview ? ' sx-previewing' : ''}${sheetOpen || menu || moving || pickerOpen ? ' sx-has-sheet' : ''}`} onKeyDown={onKeyDown}>
    <p className="sr-only" role="status">{notice}</p>
    <PitchStage toolbar={toolbar} shadows={shadows} menu={menu && menuPlayer && !replacing && <PillMenu ref={menuRef} short={short(menuPlayer)} slot={menu} lineup={lineup} player={menuPlayer} onClose={closeMenu}
        onRole={(roleId) => { if (!roleId) ghostOut(document.getElementById(`slot-${menu[0]}`)?.querySelector('.sx-role:not(.sx-flag)'), editorRef.current, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: durations.quick }); onChange(assignRole(lineup, menu[0], roleId)); setNotice(roleId ? `Role set: ${roles.find((role) => role.id === roleId)?.name}.` : 'Role removed.'); }}
        onReplace={() => { setReplacing(true); requestAnimationFrame(() => squadHeading.current?.focus({ preventScroll: true })); }}
        onMove={() => { setMoving(menu[0]); setMenuSlot(null); setSelectedSlot(null); setNotice(`Choose a position for ${menuPlayer.name}. An occupied position swaps.`); focusSlot(menu[0]); }}
        onRemove={() => { leave(menu[0]); onChange(removePlayer(lineup, menu[0])); setNotice(`${menuPlayer.name} removed. The position’s role is cleared.`); closeMenu(); }} />}>
      {shownFormation?.slots.map((slot) => {
        const [id, abbreviation, x, y] = slot;
        const occupant = shownOccupant(id);
        const role = roles.find((item) => item.id === shown.slots[id]?.roleId);
        const point = projectSlot(x, y);
        const order = waveOrder.get(id) ?? 0;
        const spot = portraitSpot(x, y);
        const style = { '--x': point.x, '--y': point.y, '--fx': spot.left, '--fy': spot.top, '--i': order, '--d': wave === 'arrive' ? 320 + order * 30 : wave === 'clear' ? 60 + order * 25 : 0 } as React.CSSProperties;
        const selected = selectedSlot === id || moving === id;
        const common = {
          id: `slot-${id}`, type: 'button' as const, style, 'aria-pressed': locked ? undefined : selected, 'aria-disabled': locked || undefined, 'data-slot': id,
          onClick: () => { if (!suppressClick.current) chooseSlot(slot); },
          'data-drop': dragged?.over === id ? 'true' : undefined,
        };
        if (!occupant) return <button key={id} {...common} className={`sx-marker sx-empty${heldPlayer || moving ? ' sx-target' : ''}`} aria-label={`${abbreviation}: Empty`}>{markerLabel(abbreviation)}</button>;
        const unavailable = !occupant.selectable;
        const placement = placements.get(id);
        return <button key={id} {...common} data-side={placement?.side ?? 'right'} data-tag={placement?.tag ?? 'below'} className={`sx-marker sx-pill${unavailable ? ' sx-unavailable' : ''}${heldPlayer || (moving && moving !== id) ? ' sx-target' : ''}${moving === id ? ' sx-moving' : ''}`} aria-expanded={locked ? undefined : menuSlot === id} aria-label={`${abbreviation}: ${occupant.name}${role ? `, ${role.name}` : ''}${unavailable ? ', unavailable' : ''}`}
          onPointerDown={(event) => startDrag(event, 'slot', id)}>
          <PillBody key={occupant.id} data-player={occupant.id} number={occupant.shirtNumber} name={short(occupant)} long={short(occupant).length > 7} />
          {(role || unavailable) && <span className="sx-tags">{role && <RoleTag key={role.id}>{role.name}</RoleTag>}{unavailable && <RoleTag flag>Unavailable</RoleTag>}</span>}
        </button>;
      })}
    </PitchStage>

    {dragged && draggedPlayer && <div className="sx-ghost" aria-hidden="true" style={{ left: dragged.x, top: dragged.y }}><PillBody number={draggedPlayer.shirtNumber} name={short(draggedPlayer)} /></div>}

    {unavailablePicked && <Notice title="Some selected players are now unavailable.">They can stay in this XI, but cannot be added again after removal.</Notice>}

    {movingPlayer && <div className="sx-movebar"><p><strong>Move {short(movingPlayer)}</strong>Tap a position. An occupied one swaps.</p><Button onClick={() => { const slotId = moving!; resetSelection(); setNotice('Move cancelled.'); focusSlot(slotId); }}>Cancel</Button></div>}

    {!locked && <section ref={squadSection} className={sheetOpen ? 'sx-squad sx-sheet' : 'sx-squad'} aria-labelledby="squad-title">
      <div className="sx-squad-head">
        <h2 id="squad-title" ref={squadHeading} tabIndex={-1}><span key={heading} className="sx-heading-text">{heading}</span></h2>
        {heldPlayer ? <span className="sx-count">Choose a position on the pitch</span> : <span className="sx-count sx-count-total">{unused.length} players not picked</span>}
        <Button variant="quiet" disabled={!count} onClick={() => { for (const slot of formation?.slots ?? []) leave(slot[0], (waveOrder.get(slot[0]) ?? 0) * 25); setWave('clear'); setTimeout(() => setWave(null), 700); onChange(clearLineup(lineup)); resetSelection(); setNotice('XI cleared. Formation kept.'); }}>Clear XI</Button>
        <label className="sx-search"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input type="search" aria-label="Search players" placeholder="Name or number" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      </div>
      {visible.length > 0 && <div className="sx-cards" role="list" aria-label="Players not picked">
        {visible.map((player) => <div role="listitem" key={player.id} data-card={player.id}>
          <Tile className="sx-card" aria-label={`${player.shirtNumber ?? ''} ${player.name}`.trim()} pressed={selectedPlayer === player.id} data-dragging={dragged?.kind === 'player' && dragged.id === player.id ? 'true' : undefined}
            onPointerDown={(event) => startDrag(event, 'player', player.id)}
            onClick={() => { if (!suppressClick.current) chooseCard(player); }}>
            <span className="sx-card-no" aria-hidden="true">{player.shirtNumber ?? '–'}</span><span className="sx-card-name" aria-hidden="true">{short(player)}</span>
          </Tile>
        </div>)}
      </div>}
      {!visible.length && <p className="sx-empty-list">{unused.length ? 'No players match your search.' : 'No eligible players left to pick.'}</p>}
      {/* Last in the sheet's tab order, after the players; Escape closes it too. */}
      <CloseButton className="sx-sheet-close" label="Close player list" onClick={() => { const slotId = selectedSlot; resetSelection(); if (slotId) focusSlot(slotId); }} />
    </section>}

  </div>;
}

type MenuProps = {
  slot: Slot; lineup: Lineup; player: PublicPlayer; short: string; ref: React.RefObject<HTMLDivElement | null>;
  onClose: () => void; onRole: (roleId: string | null) => void; onRemove: () => void; onReplace: () => void; onMove: () => void;
};
function PillMenu({ slot, lineup, player, short, ref, onClose, onRole, onRemove, onReplace, onMove }: MenuProps) {
  const [id, abbreviation, , , family] = slot;
  const roleId = lineup.slots[id]?.roleId ?? null;
  const available = rolesForFamily(family);
  const titleId = useId();
  const options = [{ value: '', label: 'No role' }, ...available.map((role) => ({ value: role.id, label: role.name, description: role.shortDefinition }))];
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
  return <div ref={ref} className="sx-panel sx-menu" role="group" aria-labelledby={titleId}
    style={{ '--mx': `${position?.left ?? 0}px`, '--my': `${position?.top ?? 0}px`, visibility: position ? undefined : 'hidden' } as React.CSSProperties}>
    <div className="sx-menu-head"><h2 id={titleId} tabIndex={-1}>{abbreviation} · {player.name}</h2>
      <CloseButton onClick={onClose} /></div>
    {!player.selectable && <p className="sx-menu-note">Unavailable for new selections. Kept in your existing XI.</p>}
    {/* Roles are optional; each one carries its definition so the choice needs no second step. */}
    <OptionList name={`${titleId}-role`} label={<>Role <span>optional</span></>} options={options} value={roleId ?? ''} onChange={(value) => onRole(value || null)} />
    {/* Replace and Move are for the touch layout, where there is no squad row beside the menu and no dragging. */}
    <div className="sx-menu-foot"><Button className="sx-touch-only" onClick={onReplace}>Replace</Button><Button className="sx-touch-only" onClick={onMove}>Move</Button><Button onClick={onRemove}>Remove player</Button><p>To replace {short}, pick a player from the squad.</p></div>
  </div>;
}
