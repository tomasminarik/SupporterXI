import type { HTMLAttributes, ReactNode } from 'react';

/** A player: the shirt number in a white disc, then the short name. On the pitch it sits inside a marker
    that positions it; anywhere else it stands on its own. */
export function PillBody({ number, name, long = false, ...props }: HTMLAttributes<HTMLSpanElement> & { number: number | null | undefined; name: string; long?: boolean }) {
  return <span {...props} className="sx-pill-body"><span className="sx-no">{number ?? '–'}</span><span className={long ? 'sx-name sx-name-long' : 'sx-name'}>{name}</span></span>;
}

/** A tag under a pill: a role in full, or (as a flag) a state such as "Unavailable". */
export function RoleTag({ flag = false, children }: { flag?: boolean; children: ReactNode }) {
  return <span className={flag ? 'sx-role sx-flag' : 'sx-role'}>{children}</span>;
}
