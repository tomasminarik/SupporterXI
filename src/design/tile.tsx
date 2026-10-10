import type { ButtonHTMLAttributes, Ref } from 'react';

/** A choice you can press: a squad card, a formation. Chosen turns white with dark text; `className` adds
    the tile's own size and type. */
export function Tile({ pressed, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean; ref?: Ref<HTMLButtonElement> }) {
  return <button type="button" aria-pressed={pressed} {...props} className={className ? `sx-tile ${className}` : 'sx-tile'} />;
}
