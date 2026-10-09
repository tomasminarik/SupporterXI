'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { plane } from './pitch-geometry';

const markings = 'M525 2V678M2 138.5H165V541.5H2M2 248.5H55V431.5H2M165 267A91.5 91.5 0 0 1 165 413M1048 138.5H885V541.5H1048M1048 248.5H995V431.5H1048M885 267A91.5 91.5 0 0 0 885 413M2 14A12 12 0 0 0 14 2M1036 2A12 12 0 0 0 1048 14M2 666A12 12 0 0 1 14 678M1036 678A12 12 0 0 1 1048 666';

/**
 * The agreed "Textured" pitch: a slab of turf tilted away from the viewer,
 * with flat overlays for goals, flags and markers. Below 900px a flat
 * bird's-eye pitch stands in until the mobile layout is designed.
 */
export default function PitchStage({ shadows, children, toolbar, menu }: { shadows: ReactNode; children: ReactNode; toolbar: ReactNode; menu?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Fit the 1160px design to narrower desktop windows. Markers stay full size;
  // only their positions scale with the pitch.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => element.style.setProperty('--k', String(Math.min(1, (element.clientWidth - 24) / (plane.width + 40))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <section ref={ref} className="sx-pitch" aria-label="Lineup pitch">
    {toolbar}
    <div className="sx-glow" aria-hidden="true" />
    <div className="sx-floor-shadow" aria-hidden="true" />
    <div className="sx-scene" aria-hidden="true">
      <div className="sx-plane">
        <div className="sx-turf" />
        <div className="sx-stripes-a" />
        <div className="sx-stripes-b" />
        <div className="sx-wear sx-wear-l" /><div className="sx-wear sx-wear-r" /><div className="sx-wear sx-wear-c" />
        <div className="sx-light" />
        <div className="sx-fade" />
        <div className="sx-soil" />
        <div className="sx-field">
          <svg viewBox="0 0 1050 680" preserveAspectRatio="none" className="sx-lines"><rect x="2" y="2" width="1046" height="676" /><path d={markings} /><circle cx="525" cy="340" r="91.5" /><circle cx="525" cy="340" r="3.5" className="dot" /><circle cx="110" cy="340" r="3.5" className="dot" /><circle cx="940" cy="340" r="3.5" className="dot" /></svg>
          {shadows}
        </div>
      </div>
    </div>
    <div className="sx-overlay">
      <div className="sx-flat" aria-hidden="true">
        <svg viewBox="0 0 680 1050" preserveAspectRatio="none" className="sx-lines"><g transform="translate(0 1050) rotate(-90)"><rect x="2" y="2" width="1046" height="676" /><path d={markings} /></g></svg>
        <span className="sx-flat-circle" />
      </div>
      <svg aria-hidden="true" viewBox="0 0 1160 760" className="sx-furniture">
        <path d="M113.9 560.1L128.9 528.9L110.9 549.3L95.3 581.2Z M113.9 560.1L95.3 581.2L113.9 581.2Z" className="net" />
        <path d="M113.9 581.2V560.1L128.9 528.9V549.3" className="post" />
        <path d="M1046.1 560.1L1031.1 528.9L1049.1 549.3L1064.7 581.2Z M1046.1 560.1L1064.7 581.2L1046.1 581.2Z" className="net" />
        <path d="M1046.1 581.2V560.1L1031.1 528.9V549.3" className="post" />
        <path d="M181.9 436.4V418M978.1 436.4V418M39.7 739.4V712M1120.3 739.4V712" className="pole" />
        <path d="M181.9 418l8 3l-8 3ZM978.1 418l8 3l-8 3ZM39.7 712l12 4.5l-12 4.5ZM1120.3 712l12 4.5l-12 4.5Z" className="flag" />
      </svg>
      {children}
    </div>
    {menu && <div className="sx-menu-layer">{menu}</div>}
  </section>;
}
