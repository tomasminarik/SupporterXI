/** Small motion helpers for the builder. Each does nothing when the visitor asks for reduced motion;
    the CSS animations are switched off for those visitors in globals.css. */
export const crisp = 'cubic-bezier(.2, .8, .2, 1)';
export const reducedMotion = () => typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Leaves an inert copy of an element where it stood and animates the copy away, so something that
    has already left the page can still be seen leaving. `inside` wraps the copy for styles that depend on a parent. */
export function ghostOut(source: Element | null | undefined, host: HTMLElement | null, keyframes: Keyframe[], options: { duration?: number; delay?: number; inside?: { className: string; side?: string } } = {}) {
  if (!source || !host || reducedMotion()) return;
  const rect = source.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'sx-ghost-out';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  ghost.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
  const copy = source.cloneNode(true) as HTMLElement;
  for (const element of [copy, ...copy.querySelectorAll('[id]')]) element.removeAttribute('id');
  copy.style.animation = 'none';
  let holder: HTMLElement = ghost;
  if (options.inside) {
    holder = document.createElement('div');
    holder.className = options.inside.className;
    if (options.inside.side) holder.dataset.side = options.inside.side;
    holder.style.cssText = 'position:static;transform:none';
    ghost.append(holder);
  }
  holder.append(copy);
  host.append(ghost);
  const animation = ghost.animate(keyframes, { duration: options.duration ?? 180, delay: options.delay ?? 0, easing: crisp, fill: 'both' });
  animation.onfinish = animation.oncancel = () => ghost.remove();
}

/** Plays an element from where it used to be to where it now is. */
export function glideFrom(element: Element | null | undefined, before: { x: number; y: number }, duration = 220) {
  if (!element || reducedMotion()) return;
  const now = element.getBoundingClientRect();
  const dx = before.x - now.left;
  const dy = before.y - now.top;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  for (const running of element.getAnimations()) running.cancel();
  element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing: crisp });
}
