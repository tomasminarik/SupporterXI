// The Supporter XI pill logo (docs/design/reference/logo.dc.html). The XI is
// drawn as three strokes so it stays sharp and is centred by geometry.
const regular = 'M4 2L18 26M18 2L4 26M31.5 2V26';
const bold = 'M5.5 1L17.5 27M17.5 1L5.5 27M30.5 1V27';

export function XiMark({ width, height, heavy = false }: { width: number; height: number; heavy?: boolean }) {
  return <svg aria-hidden="true" width={width} height={height} viewBox="0 0 36 28"><path d={heavy ? bold : regular} fill="none" stroke="currentColor" strokeWidth={heavy ? 8.5 : 6.5} /></svg>;
}

/** Full logo, 40px tall as in the agreed header. The full pill is only used at 32px and above. */
export function Logo() {
  return <span className="sx-logo" role="img" aria-label="Supporter XI"><span className="sx-logo-disc"><XiMark width={18} height={14} /></span><span aria-hidden="true">Supporter</span></span>;
}
