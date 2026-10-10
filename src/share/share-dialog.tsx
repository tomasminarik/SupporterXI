'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button, CloseButton } from '../design/button';
import Notice from '../design/notice';
import { renderSharePng } from './render';
import { track } from '../analytics/analytics';
import { describeSnapshot, shareFileName, shareFormats, type ShareFormat, type ShareSnapshot } from './snapshot';
import './share.css';

type Result = { status: 'drawing' } | { status: 'ready'; blob: Blob; url: string } | { status: 'failed' };
const formatIds = Object.keys(shareFormats) as ShareFormat[];

/** Preview, size choice and download for one snapshot of the XI. A dialog on desktop, a bottom sheet on phones. */
export default function ShareDialog({ snapshot, onClose }: { snapshot: ShareSnapshot; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const [format, setFormat] = useState<ShareFormat>('square');
  const [results, setResults] = useState<Partial<Record<ShareFormat, Result>>>({});
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('');
  const urls = useRef<string[]>([]);
  const result = results[format] ?? { status: 'drawing' };

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) element.showModal();
    heading.current?.focus();
    const made = urls.current;
    return () => { for (const url of made) URL.revokeObjectURL(url); };
  }, []);

  // Each size is drawn once, when first chosen, from the same snapshot.
  useEffect(() => {
    let current = true;
    renderSharePng(snapshot, format).then((blob) => {
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      if (current) setResults((previous) => ({ ...previous, [format]: { status: 'ready', blob, url } }));
    }, () => { if (current) { setResults((previous) => ({ ...previous, [format]: { status: 'failed' } })); track('share_failed', { fixture: snapshot.fixtureId, size: format }); } });
    return () => { current = false; };
  }, [snapshot, format, attempt]);

  const size = shareFormats[format];
  const name = shareFileName(snapshot, format);
  const file = result.status === 'ready' ? new File([result.blob], name, { type: 'image/png' }) : null;
  const canShare = Boolean(file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }));
  function choose(next: ShareFormat) { setFormat(next); setMessage(''); }
  function retry() {
    setResults((previous) => ({ ...previous, [format]: { status: 'drawing' } }));
    setAttempt((value) => value + 1);
    heading.current?.focus();
  }
  function download() {
    if (result.status !== 'ready') return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setMessage(`Download started: ${name}`);
    track('share_image_saved', { fixture: snapshot.fixtureId, size: format, method: 'download' });
  }
  async function share() {
    if (!file) return;
    try { await navigator.share({ files: [file] }); setMessage(''); track('share_image_saved', { fixture: snapshot.fixtureId, size: format, method: 'share' }); }
    catch (error) { if ((error as Error).name !== 'AbortError') setMessage('Sharing did not work here. Download the image instead.'); }
  }

  return <dialog ref={dialog} className="sx-panel sx-share-dialog" aria-labelledby={titleId} onClose={onClose} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}>
    <div className="sx-share-body">
      <div className="sx-share-preview" data-format={format} aria-busy={result.status === 'drawing'}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview, not a served image */}
        {result.status === 'ready' && <img src={result.url} width={size.width} height={size.height} alt={`Preview of your image. ${describeSnapshot(snapshot)}`} />}
        {result.status === 'drawing' && <p className="sx-share-drawing" role="status"><span className="sx-share-spinner" aria-hidden="true" />Drawing your image…</p>}
        {result.status === 'failed' && <Notice tone="problem" role="alert" title="The image could not be made." action={<Button onClick={retry}>Try again</Button>}>Your XI is unchanged.</Notice>}
      </div>
      <div className="sx-share-panel">
        <div className="sx-share-head">
          <h2 id={titleId} ref={heading} tabIndex={-1}>Share your XI</h2>
          <CloseButton onClick={() => dialog.current?.close()} />
        </div>
        <fieldset className="sx-share-formats">
          <legend className="sx-label">Image size</legend>
          {formatIds.map((id) => <label key={id} className="sx-tile sx-share-format">
            <input type="radio" name="share-format" value={id} checked={format === id} onChange={() => choose(id)} />
            <span className="sx-share-shape" data-format={id} aria-hidden="true" />
            <span className="sx-share-format-text"><strong>{shareFormats[id].label}</strong><span>{shareFormats[id].shape} · {shareFormats[id].width} × {shareFormats[id].height}</span></span>
          </label>)}
        </fieldset>
        <div className="sx-share-actions">
          <button type="button" className="sx-share-go" disabled={result.status !== 'ready'} onClick={download}>Download image</button>
          {canShare && <Button onClick={share}>Share…</Button>}
        </div>
        <p className="sx-share-message" role="status">{message}</p>
        <p className="sx-share-note">The image is made in this browser and is not uploaded anywhere. Roles are not shown on it.</p>
      </div>
    </div>
  </dialog>;
}
