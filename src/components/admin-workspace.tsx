'use client';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, Card, Checkbox, ConfigProvider, Form, Input, Modal, Select as AntSelect, Spin, Tabs, Tag, type SelectProps } from 'antd';
import { contentSchema, effectiveFixture, type SharedContent, type Fixture } from '../domain/content';
import { type AdminCommand, applyAdminCommand } from '../domain/admin';
import AdminAvailability from './admin-availability';
import './admin.css';

// Ant's option list needs its own name in addition to the labelled combobox.
function Select<T extends string>(props: SelectProps<T>) {
  return <AntSelect {...props} virtual={false} popupRender={(options) => <div ref={(node) => {
    node?.querySelector('[role="listbox"]')?.setAttribute('aria-label', String(props['aria-label'] ?? 'Options'));
  }}>{options}</div>}/>;
}

type Source = { revision: string; content: SharedContent; csrf?: string };
const sourceSchema = z.object({ revision: z.string(), content: contentSchema, csrf: z.string().optional(), publication: z.object({ commit: z.string(), digest: z.string(), state: z.string() }).optional() });
async function call(url: string, init?: RequestInit) {
  // Publication may need the live probe (10s) and two GitHub requests (12s each).
  const response = await fetch(url, { ...init, cache: 'no-store', signal: init?.signal ?? AbortSignal.timeout(60_000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'Request failed. Your edits are still here.');
  return body;
}
type Publication = { commit: string; digest: string; state: string };
const failure = (e: unknown) => e instanceof z.ZodError ? 'Invalid fields. Check required names, shirt numbers and the kickoff timezone.' : (e as Error).message;

export default function AdminWorkspace({ demo }: { demo?: SharedContent }) {
  const router = useRouter();
  const [source, setSource] = useState<Source | null>(demo ? { content: demo, revision: 'preview' } : null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(!demo);
  const [notice, setNotice] = useState('');
  const [publish, setPublish] = useState<Publication | null>(null);
  const [importReport, setImportReport] = useState('');
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { const result = sourceSchema.parse(await call('/api/admin/content')); setSource(result); setPublish(result.publication ?? null); setReload((value) => value + 1); } catch (e) { setError(failure(e)); } finally { setBusy(false); }
  }, []);
  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    void call('/api/admin/content').then((body) => { if (!cancelled) { const result = sourceSchema.parse(body); setSource(result); setPublish(result.publication ?? null); } }).catch((e) => { if (!cancelled) setError(failure(e)); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [demo]);
  // A saved change goes live by itself a couple of minutes later; watch for it instead of asking for a click.
  const watching = publish?.state === 'pending' ? `${publish.commit}/${publish.digest}` : null;
  useEffect(() => {
    if (!watching) return;
    const [commit, digest] = watching.split('/');
    let checks = 0;
    const timer = setInterval(() => {
      if (++checks > 40) return clearInterval(timer);
      void call(`/api/admin/publish?commit=${commit}&digest=${digest}`).then((result) => setPublish((current) => current?.commit === commit ? { ...current, state: result.state } : current)).catch(() => { /* The next check retries. */ });
    }, 12_000);
    return () => clearInterval(timer);
  }, [watching]);
  /** Resolves true when the change was accepted, so a form can clear its unsaved state. */
  async function save(command: AdminCommand): Promise<boolean> {
    if (!source) return false;
    setBusy(true); setError(''); setNotice('');
    try {
      if (demo) {
        setSource({ content: applyAdminCommand(source.content, command, () => crypto.randomUUID()), revision: crypto.randomUUID() });
        setNotice('Applied in this preview only. Reload resets these changes.');
      } else {
        const result = await call('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': source.csrf! }, body: JSON.stringify({ revision: source.revision, command }) });
        setSource({ ...sourceSchema.parse(result), csrf: source.csrf });
        if (result.commit) { setPublish({ commit: result.commit, digest: result.digest, state: 'pending' }); setNotice('Saved.'); }
        else setNotice('Nothing changed, so there is nothing to publish.');
      }
      return true;
    } catch (e) { setError(failure(e)); return false; } finally { setBusy(false); }
  }
  async function checkPublish() {
    if (!publish) return;
    setBusy(true); setError('');
    try { const result = await call(`/api/admin/publish?commit=${publish.commit}&digest=${publish.digest}`); setPublish({ ...publish, state: result.state }); setNotice(''); } catch (e) { setError(failure(e)); } finally { setBusy(false); }
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
      if (result.commit) { setPublish({ commit: result.commit, digest: result.digest, state: 'pending' }); setNotice('Fixtures imported.'); }
      else setNotice('Import made no content changes.');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function signOut() {
    try { await call('/api/admin/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': source!.csrf! }, body: '{}' }); router.replace('/gaffer'); router.refresh(); } catch (e) { setError((e as Error).message); }
  }
  return <ConfigProvider componentDisabled={busy}>
    <header className="admin-top">
      <div><Link href={demo ? '/dev/workbench' : '/'}>← {demo ? 'Builder preview' : 'Supporter XI'}</Link><h1>Gaffer</h1></div>
      {!demo && <div className="admin-actions"><Button disabled={busy || !source} onClick={() => setConfirmImport(true)}>Import fixtures</Button><Button onClick={() => { if (source) setConfirmReload(true); else void load(); }}>Reload</Button><Button type="text" disabled={busy || !source} onClick={() => void signOut()}>Sign out</Button></div>}
    </header>
    {demo && <Alert className="admin-demo" type="warning" showIcon title="Preview only" description="Changes stay in this page’s memory and reset on reload. Nothing is published or written to GitHub. Use synthetic fixture names." />}
    <Modal title="Reload current content?" open={confirmReload} onCancel={() => setConfirmReload(false)} onOk={() => { setConfirmReload(false); void load(); }} okText="Reload and discard edits" cancelText="Keep editing"><p>Unsaved form edits will be discarded. The latest accepted content will replace this editor.</p></Modal>
    <Modal title="Import fixtures?" open={confirmImport} onCancel={() => setConfirmImport(false)} onOk={() => { setConfirmImport(false); void importFixtures(); }} okText="Import fixtures now"><p>This reads Manchester United Premier League and Champions League matches from football-data.org. Any unsaved form edits will be discarded if the import succeeds.</p></Modal>
    <div className="admin-feedback" aria-live="polite">
      {busy && <p role="status">Working…</p>}
      {error && <Alert className="admin-error" type="error" showIcon title={error} role="alert"/>}
      {notice && <Alert type="success" showIcon title={notice} role="status"/>}
      {importReport && <Alert type="info" showIcon title={`Import: ${importReport}`} role="status"/>}
      {publish && <PublicationStatus publish={publish} check={checkPublish} />}
    </div>
    {source && <AdminForms key={reload} revision={source.revision} content={source.content} save={save} busy={busy}/>}
  </ConfigProvider>;
}

/** Where the last saved change is on its way to the public site. A pending change is re-checked automatically. */
function PublicationStatus({ publish, check }: { publish: Publication; check: () => void }) {
  const commit = `Change ${publish.commit.slice(0, 7)}`;
  if (publish.state === 'live') return <p className="admin-live"><Tag color="success">Live</Tag>The site shows your latest saved changes.</p>;
  if (publish.state === 'failed') return <Alert type="error" showIcon title="Publishing failed. The site still shows the previous version." description={`${commit} did not deploy. Nothing was lost: save again, or check the deployment in Vercel.`} action={<Button onClick={check}>Check again</Button>} />;
  if (publish.state === 'pending') return <Alert type="warning" showIcon icon={<Spin size="small" />} title="Publishing to the site…" description={`${commit} usually goes live in about two minutes. This updates by itself, and you can keep working.`} action={<Button onClick={check}>Check now</Button>} />;
  return <Alert type="info" showIcon title="Could not confirm what is live." description={`${commit} is the latest saved change.`} action={<Button onClick={check}>Check now</Button>} />;
}

function fixtureOptions(content: SharedContent) {
  return content.fixtures.map((f) => ({ value: f.id, label: `${effectiveFixture(f).opponent} · ${effectiveFixture(f).status}` }));
}
function AdminForms({ content, save, busy, revision }: { revision: string; content: SharedContent; save: (command: AdminCommand) => Promise<boolean>; busy: boolean }) {
  const [tab, setTab] = useState('availability');
  const [fixtureId, setFixtureId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const fixture = content.fixtures.find((f) => f.id === fixtureId);
  const player = content.players.find((p) => p.id === playerId);
  const options = fixtureOptions(content);
  const editor = <div className="admin-fields" aria-busy={busy}>
    {tab === 'fixtures' && <div className="admin-fixtures-layout">
      <Card className="admin-box admin-featured"><h2>Featured fixture</h2><Tag color={content.featuredFixtureId ? 'warning' : 'default'}>{content.featuredFixtureId ? 'Manual override' : 'Automatic selection'}</Tag><p>Lineups lock 15 minutes after kickoff. The next match takes over at 120 minutes. A manual selection stays featured until cleared.</p>
        <label htmlFor="featured-match">Featured match</label><Select id="featured-match" value={content.featuredFixtureId ?? ''} onChange={(id) => void save({ kind: 'featured', id: id || null })} options={[{ value: '', label: 'Automatic' }, ...options]} />
        {content.featuredFixtureId && <p role="status">{content.fixtures.some((f) => f.id === content.featuredFixtureId && effectiveFixture(f).status === 'scheduled') ? 'Manual featured selection is active.' : 'The selected fixture is not scheduled. Automatic selection is used instead.'}</p>}
      </Card>
      <Card className="admin-box"><h2>Fixtures</h2><label htmlFor="edit-fixture">Edit fixture</label><Select id="edit-fixture" showSearch optionFilterProp="label" value={fixtureId} onChange={setFixtureId} options={[{ value: '', label: 'Create a manual fixture' }, ...content.fixtures.map((f) => ({ value: f.id, label: `${effectiveFixture(f).opponent} · ${f.source.kind}` }))]} /><FixtureForm key={fixtureId + revision} fixture={fixture} save={save}/></Card>
    </div>}
    {tab === 'squad' && <Card className="admin-box"><h2>Squad · {content.players.length} players</h2><p>Active players require unique numbers from 1–99. Inactive players may have no number. Deactivation preserves identity and existing selections.</p><label htmlFor="edit-player">Edit player</label><Select id="edit-player" showSearch optionFilterProp="label" value={playerId} onChange={setPlayerId} options={[{ value: '', label: 'Create a player' }, ...content.players.map((p) => ({ value: p.id, label: `${p.shirtNumber ?? '—'} · ${p.name}${!p.active ? ' (Inactive)' : ''}` }))]} />
      <Form key={playerId + revision} layout="vertical" initialValues={{ name: player?.name ?? '', number: player?.shirtNumber ?? '', active: player?.active ?? true }} onFinish={(data) => void save({ kind: 'player', id: player?.id ?? null, values: { name: data.name, shirtNumber: data.number === '' ? null : Number(data.number), active: data.active } })}>
        <div className="admin-columns"><Form.Item label="Name" name="name" rules={[{ required: true, whitespace: true, message: 'Enter the player name.' }]}><Input maxLength={200}/></Form.Item><Form.Item label="Shirt number" name="number"><Input type="number" min={1} max={99} step={1}/></Form.Item></div>
        <Form.Item name="active" valuePropName="checked"><Checkbox>Active</Checkbox></Form.Item><Button type="primary" htmlType="submit">{player ? 'Save player' : 'Create player'}</Button>
      </Form></Card>}
    {tab === 'availability' && <AdminAvailability content={content} busy={busy} save={save} />}
    </div>;
  return <Tabs activeKey={tab} onChange={setTab} items={['availability', 'fixtures', 'squad'].map((name) => ({ key: name, label: name[0].toUpperCase() + name.slice(1), disabled: busy, children: name === tab ? editor : null }))}/>;
}
function FixtureForm({ fixture, save }: { fixture?: Fixture; save: (command: AdminCommand) => Promise<boolean> }) {
  const value = fixture ? effectiveFixture(fixture) : null;
  const [clearField, setClearField] = useState<keyof Fixture['values'] | null>(null);
  return <><Form layout="vertical" initialValues={{ opponent: value?.opponent ?? '', venue: value?.venue ?? 'home', status: value?.status ?? 'scheduled', competition: value?.competition ?? '', round: value?.round ?? '', kickoff: value?.kickoff.kind === 'confirmed' ? value.kickoff.at : '' }} onFinish={(data) => {
    const at = data.kickoff.trim();
    void save({ kind: 'fixture', id: fixture?.id ?? null, values: { opponent: data.opponent, venue: data.venue, competition: data.competition.trim() || null, round: data.round.trim() || null, status: data.status, kickoff: at ? { kind: 'confirmed', at } : { kind: 'unknown' } } });
  }}>
    <Form.Item label="Opponent" name="opponent" rules={[{ required: true, whitespace: true, message: 'Enter the opponent.' }]}><Input maxLength={200}/></Form.Item>
    <div className="admin-columns"><Form.Item label="Venue" name="venue"><Select options={[{ value: 'home', label: 'Home' }, { value: 'away', label: 'Away' }]}/></Form.Item><Form.Item label="Status" name="status"><Select options={[{ value: 'scheduled', label: 'Scheduled' }, { value: 'postponed', label: 'Postponed' }, { value: 'cancelled', label: 'Cancelled' }]}/></Form.Item></div>
    <div className="admin-columns"><Form.Item label="Competition" name="competition"><Input maxLength={200}/></Form.Item><Form.Item label="Round" name="round"><Input maxLength={200}/></Form.Item></div>
    <Form.Item label="Kickoff with timezone" name="kickoff" extra="Leave blank for time to be confirmed. Otherwise enter an ISO date and time with an explicit offset or Z."><Input placeholder="2026-10-25T16:30:00+00:00"/></Form.Item>
    <Button type="primary" htmlType="submit">{fixture ? 'Save fixture' : 'Create fixture'}</Button>
  </Form>
  {fixture?.source.kind === 'football-data.org' && <section className="admin-corrections"><h3>Imported values and corrections</h3><p>Edits override only changed fields. Clearing one correction resumes the imported value shown below.</p>{(Object.keys(fixture.values) as (keyof typeof fixture.values)[]).map((field) => <div className="admin-override" key={field}><strong>{field}</strong><p>Imported: {JSON.stringify(fixture.values[field])}<br/>Effective: {JSON.stringify(value![field])}</p>{Object.hasOwn(fixture.overrides, field) ? <><p>Manual correction: {JSON.stringify(fixture.overrides[field])}</p><Button onClick={() => setClearField(field)}>Clear {field} correction</Button></> : <Tag>No manual correction</Tag>}</div>)}</section>}
  <Modal title={`Clear ${clearField} correction?`} open={clearField !== null} onCancel={() => setClearField(null)} okText="Clear correction" onOk={() => { if (fixture && clearField) void save({ kind: 'clear-override', id: fixture.id, field: clearField }); setClearField(null); }}><p>Resume the imported value: {fixture && clearField ? JSON.stringify(fixture.values[clearField]) : ''}. Other corrections will stay in place.</p></Modal>
  </>;
}
