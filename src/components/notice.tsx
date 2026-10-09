import type { ReactNode } from 'react';

type Tone = 'info' | 'attention' | 'problem';
const cross = <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>;
const marks: Record<Tone, ReactNode> = { info: 'i', attention: '!', problem: cross };

/** The public page's one notice style. The mark's glyph carries the tone as well as its colour.
    `block` is for states that stand in for the builder, such as a lineup that cannot be restored. */
export default function Notice({ tone = 'info', title, children, action, role = 'status', block = false }: {
  tone?: Tone; title: ReactNode; children?: ReactNode; action?: ReactNode; role?: 'status' | 'alert'; block?: boolean;
}) {
  return <div className={block ? 'sx-notice sx-notice-block' : 'sx-notice'} data-tone={tone} role={role}>
    <span className="sx-notice-mark" aria-hidden="true">{marks[tone]}</span>
    <div className="sx-notice-text"><strong>{title}</strong>{children && <p>{children}</p>}</div>
    {action}
  </div>;
}
