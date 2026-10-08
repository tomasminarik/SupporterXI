'use client';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { contentSchema, effectiveFixture, type SharedContent, type Fixture } from '../domain/content';
import { type AdminCommand, applyAdminCommand } from '../domain/admin';
import './admin.css';

type Source = { revision: string; content: SharedContent; csrf?: string };
const sourceSchema = z.object({ revision: z.string(), content: contentSchema, csrf: z.string().optional(), publication: z.object({ commit: z.string(), digest: z.string(), state: z.string() }).optional() });
async function call(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store', signal: init?.signal ?? AbortSignal.timeout(20_000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'Request failed. Your edits are still here.');
  return body;
}
export default function AdminWorkspace({ demo }: { demo?: SharedContent }) {
  const router = useRouter();
  const [source, setSource] = useState<Source | null>(demo ? { content: demo, revision: 'preview' } : null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(!demo);
  const [notice, setNotice] = useState('');
  const [publish, setPublish] = useState<{ commit: string; digest: string; state: string } | null>(null);
  const [importReport, setImportReport] = useState('');
  const [confirmImport, setConfirmImport] = useState(false);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { const result = sourceSchema.parse(await call('/api/admin/content')); setSource(result); setPublish(result.publication ?? null); setReload((value) => value + 1); } catch (e) { setError(e instanceof z.ZodError ? 'Invalid fields. Check required names, shirt numbers and the kickoff timezone.' : (e as Error).message); } finally { setBusy(false); }
  }, []);
  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    void call('/api/admin/content').then((body) => { if (!cancelled) { const result = sourceSchema.parse(body); setSource(result); setPublish(result.publication ?? null); } }).catch((e) => { if (!cancelled) setError(e instanceof z.ZodError ? 'Invalid fields. Check required names, shirt numbers and the kickoff timezone.' : (e as Error).message); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [demo]);
  async function save(command: AdminCommand) {
    if (!source) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (demo) {
        setSource({ content: applyAdminCommand(source.content, command, () => crypto.randomUUID()), revision: crypto.randomUUID() });
        setNotice('Applied in this preview only. Reload resets these changes.');
      } else {
        const result = await call('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': source.csrf! }, body: JSON.stringify({ revision: source.revision, command }) });
        setSource({ ...sourceSchema.parse(result), csrf: source.csrf });
        if (result.commit) { setPublish({ commit: result.commit, digest: result.digest, state: 'pending' }); setNotice('Saved to GitHub. Publication is pending; the previous content stays live until deployment succeeds.'); }
        else setNotice('No content changes to publish.');
      }
    } catch (e) { setError(e instanceof z.ZodError ? 'Invalid fields. Check required names, shirt numbers and the kickoff timezone.' : (e as Error).message); } finally { setBusy(false); }
  }
  async function checkPublish() {
    if (!publish) return;
    setBusy(true); setError('');
    try { const result = await call(`/api/admin/publish?commit=${publish.commit}&digest=${publish.digest}`); setPublish({ ...publish, state: result.state }); } catch (e) { setError(e instanceof z.ZodError ? 'Invalid fields. Check required names, shirt numbers and the kickoff timezone.' : (e as Error).message); } finally { setBusy(false); }
  }
  async function importFixtures() {
    if (!source) return;
    setBusy(true); setError(''); setNotice(''); setImportReport('');
    try {
      const result = await call('/api/admin/import', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': source.csrf! }, body: '{}', signal: AbortSignal.timeout(75_000) });
      setSource({ ...sourceSchema.parse(result), csrf: source.csrf });
      setReload((value) => value + 1);
      const report = result.report as { added: number; updated: number; unchanged: number; ambiguous: string[]; skipped: number };
      setImportReport(`${report.added} added, ${report.updated} updated, ${report.unchanged} unchanged, ${report.skipped} outside scope.${report.ambiguous.length ? ` Potential manual duplicates (provider IDs): ${report.ambiguous.join(', ')}. Review these manually; none were merged.` : ''}`);
      if (result.commit) { setPublish({ commit: result.commit, digest: result.digest, state: 'pending' }); setNotice('Fixture import saved to GitHub. Publication is pending.'); }
      else setNotice('Import made no content changes.');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <>
    <div className="admin-actions">{!demo && <><button disabled={busy} onClick={() => { if (!source || window.confirm('Reload current content? Unsaved form edits will be discarded.')) void load(); }}>Reload latest content</button><button disabled={busy || !source} onClick={() => setConfirmImport(true)}>Refresh PL / Champions League fixtures</button><button disabled={busy || !source} onClick={async () => { try { await call('/api/admin/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': source!.csrf! }, body: '{}' }); router.replace('/admin'); router.refresh(); } catch (e) { setError(e instanceof z.ZodError ? 'Invalid fields. Check required names, shirt numbers and the kickoff timezone.' : (e as Error).message); } }}>Sign out</button></>}</div>
    {confirmImport && <aside className="admin-box" aria-label="Confirm fixture refresh"><strong>Refresh covered fixtures?</strong><p>This reads Manchester United Premier League and Champions League matches from football-data.org. Any unsaved form edits will be discarded if the refresh succeeds.</p><div className="admin-actions"><button className="admin-primary" disabled={busy} onClick={() => { setConfirmImport(false); void importFixtures(); }}>Refresh fixtures now</button><button disabled={busy} onClick={() => setConfirmImport(false)}>Cancel</button></div></aside>}
    {busy && <p role="status">Working…</p>}{error && <p className="admin-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {importReport && <p role="status">Import: {importReport}</p>}
    {publish && <aside className="admin-box" aria-label="Publication status"><strong>{publish.state === 'live' ? 'Live content verified' : publish.state === 'failed' ? 'Deployment failed — previous site retained' : 'Publication pending / not yet verified live'}</strong><p>Commit {publish.commit.slice(0, 7)}. A successful save alone does not mean the public site has updated.</p><button disabled={busy} onClick={checkPublish}>Check publication</button></aside>}
    {source && <AdminForms key={reload} revision={source.revision} content={source.content} save={save} busy={busy}/>}
  </>;
}
function AdminForms({ content, save, busy, revision }: { revision: string; content: SharedContent; save: (command: AdminCommand) => Promise<void>; busy: boolean }) {
  const [tab, setTab] = useState('fixtures');
  const [fixtureId, setFixtureId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [availableFixture, setAvailableFixture] = useState(content.fixtures[0]?.id ?? '');
  const selectedAvailabilityFixture = content.fixtures.some((f) => f.id === availableFixture) ? availableFixture : (content.fixtures[0]?.id ?? '');
  const fixture = content.fixtures.find((f) => f.id === fixtureId);
  const player = content.players.find((p) => p.id === playerId);
  return <><nav className="admin-tabs" aria-label="Administration sections">{['fixtures', 'squad', 'availability'].map((name) => <button key={name} disabled={busy} aria-current={tab === name ? 'page' : undefined} onClick={() => setTab(name)}>{name[0].toUpperCase() + name.slice(1)}</button>)}</nav>
    <fieldset disabled={busy} className="admin-fields"><legend className="sr-only">Shared content editor</legend>
    {tab === 'fixtures' && <>
      <section className="admin-box"><h2>Featured fixture</h2><p>Automatic selection uses kickoff plus three hours. A manual selection stays featured until cleared.</p>
        <label>Featured match<select value={content.featuredFixtureId ?? ''} onChange={(e) => void save({ kind: 'featured', id: e.target.value || null })}><option value="">Automatic</option>{content.fixtures.map((f) => <option key={f.id} value={f.id}>{effectiveFixture(f).opponent} · {effectiveFixture(f).status}</option>)}</select></label>
        {content.featuredFixtureId && <p role="status">{content.fixtures.some((f) => f.id === content.featuredFixtureId && effectiveFixture(f).status === 'scheduled') ? 'Manual featured selection is active.' : 'The selected fixture is not scheduled. Automatic selection is used instead.'}</p>}
      </section>
      <section className="admin-box"><h2>Fixtures</h2><label>Edit fixture<select value={fixtureId} onChange={(e) => setFixtureId(e.target.value)}><option value="">Create a manual fixture</option>{content.fixtures.map((f) => <option key={f.id} value={f.id}>{effectiveFixture(f).opponent} · {f.source.kind}</option>)}</select></label><FixtureForm key={fixtureId + revision} fixture={fixture} save={save}/></section>
    </>}
    {tab === 'squad' && <section className="admin-box"><h2>Squad · {content.players.length} players</h2><p>Active players require unique numbers from 1–99. Inactive players may have no number. Deactivation preserves identity and existing selections.</p><label>Edit player<select value={playerId} onChange={(e) => setPlayerId(e.target.value)}><option value="">Create a player</option>{content.players.map((p) => <option key={p.id} value={p.id}>{p.shirtNumber ?? '—'} · {p.name}{!p.active ? ' (Inactive)' : ''}</option>)}</select></label>
      <form key={playerId + revision} onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); void save({ kind: 'player', id: player?.id ?? null, values: { name: String(data.get('name')), shirtNumber: data.get('number') === '' ? null : Number(data.get('number')), active: data.get('active') === 'on' } }); }}>
        <label>Name<input name="name" required maxLength={200} defaultValue={player?.name ?? ''}/></label><label>Shirt number<input name="number" type="number" min={1} max={99} step={1} defaultValue={player?.shirtNumber ?? ''}/></label><label className="admin-check"><input name="active" type="checkbox" defaultChecked={player?.active ?? true}/>Active</label><button className="admin-primary">{player ? 'Save player' : 'Create player'}</button>
      </form></section>}
    {tab === 'availability' && <section className="admin-box"><h2>Fixture availability</h2><p>Available is the default. Inactive players cannot be added to a new XI regardless of this setting.</p>{!content.fixtures.length ? <p>Create a fixture first.</p> : <><label>Availability for<select value={selectedAvailabilityFixture} onChange={(e) => setAvailableFixture(e.target.value)}>{content.fixtures.map((f) => <option key={f.id} value={f.id}>{effectiveFixture(f).opponent}</option>)}</select></label><div className="admin-roster">{content.players.map((p) => <label key={p.id}><span>{p.shirtNumber ?? '—'} · {p.name}{!p.active ? ' (Inactive)' : ''}</span><select aria-label={`Availability: ${p.name}`} value={content.fixtureAvailability.find((a) => a.fixtureId === selectedAvailabilityFixture && a.playerId === p.id)?.status ?? 'available'} onChange={(e) => void save({ kind: 'availability', fixtureId: selectedAvailabilityFixture, playerId: p.id, status: e.target.value as 'available' | 'unavailable' })}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>)}</div></>}</section>}
    </fieldset></>;
}
function FixtureForm({ fixture, save }: { fixture?: Fixture; save: (command: AdminCommand) => Promise<void> }) {
  const value = fixture ? effectiveFixture(fixture) : null;
  return <><form onSubmit={(e) => {
    e.preventDefault(); const data = new FormData(e.currentTarget); const at = String(data.get('kickoff')).trim();
    void save({ kind: 'fixture', id: fixture?.id ?? null, values: { opponent: String(data.get('opponent')), venue: data.get('venue') as 'home' | 'away', competition: String(data.get('competition')).trim() || null, round: String(data.get('round')).trim() || null, status: data.get('status') as 'scheduled' | 'postponed' | 'cancelled', kickoff: at ? { kind: 'confirmed', at } : { kind: 'unknown' } } });
  }}>
    <label>Opponent<input name="opponent" required maxLength={200} defaultValue={value?.opponent ?? ''}/></label>
    <div className="admin-columns"><label>Venue<select name="venue" defaultValue={value?.venue ?? 'home'}><option value="home">Home</option><option value="away">Away</option></select></label><label>Status<select name="status" defaultValue={value?.status ?? 'scheduled'}><option value="scheduled">Scheduled</option><option value="postponed">Postponed</option><option value="cancelled">Cancelled</option></select></label></div>
    <div className="admin-columns"><label>Competition<input name="competition" maxLength={200} defaultValue={value?.competition ?? ''}/></label><label>Round<input name="round" maxLength={200} defaultValue={value?.round ?? ''}/></label></div>
    <label>Kickoff with timezone<input name="kickoff" aria-describedby="kickoff-help" placeholder="2026-10-25T16:30:00+00:00" defaultValue={value?.kickoff.kind === 'confirmed' ? value.kickoff.at : ''}/></label><p id="kickoff-help">Leave blank for time to be confirmed. Otherwise enter an ISO date and time with an explicit offset or Z.</p>
    <button className="admin-primary">{fixture ? 'Save fixture' : 'Create fixture'}</button>
  </form>
  {fixture?.source.kind === 'football-data.org' && <section><h3>Imported values and corrections</h3><p>Edits override only changed fields. Clearing one correction resumes the imported value shown below.</p>{(Object.keys(fixture.values) as (keyof typeof fixture.values)[]).map((field) => <div className="admin-override" key={field}><strong>{field}</strong><p>Imported: {JSON.stringify(fixture.values[field])}<br/>Effective: {JSON.stringify(value![field])}</p>{Object.hasOwn(fixture.overrides, field) ? <><p>Manual correction: {JSON.stringify(fixture.overrides[field])}</p><button onClick={() => { if (window.confirm(`Clear ${field} correction and resume ${JSON.stringify(fixture.values[field])}?`)) void save({ kind: 'clear-override', id: fixture.id, field }); }}>Clear {field} correction</button></> : <span>No manual correction</span>}</div>)}</section>}
  </>;
}
