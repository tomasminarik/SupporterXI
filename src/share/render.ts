import { plane } from '../components/pitch-geometry';
import { tokenValue } from '../design/tokens';
import { fitHeadline, frame, landscape, landscapeNearEdge, markerFor, placePills, placePlayers, type Box, type Measure } from './layout';
import { shareAddress, shareFormats, type ShareFormat, type ShareSnapshot } from './snapshot';

// Draws the share image on a canvas from a snapshot (architecture record: browser canvas, bundled
// fonts, original local assets). Nothing is captured from the page and nothing leaves the browser.
const display = '"Big Shoulders Display"';
const body = 'Barlow';
// Colours come from the design tokens; the pitch's own paint (lines, grass, soil) is not part of the system.
const colour = { page: tokenValue('page'), red: tokenValue('club'), deep: tokenValue('club-pressed'), white: tokenValue('white'), text: tokenValue('text'), soft: tokenValue('text-soft'), quiet: tokenValue('text-quiet'), v: tokenValue('text-versus'), line: '#f4f6ee', yellow: tokenValue('action') };

export type ShareAssets = { turf: CanvasImageSource };

let turfRequest: Promise<HTMLImageElement> | null = null;
function loadTurf(): Promise<HTMLImageElement> {
  turfRequest ??= new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The pitch texture did not load'));
    image.src = '/turf.webp';
  }).catch((error) => { turfRequest = null; throw error; });
  return turfRequest;
}

/** Waits for the faces and the texture the image uses. A missing face is a failure, never a fallback font. */
export async function loadShareAssets(snapshot: ShareSnapshot): Promise<ShareAssets> {
  const text = `MANCHESTER UNITED V ${snapshot.opponent} ${snapshot.formation} ${snapshot.players.map((player) => `${player.name} ${player.number ?? ''}`).join(' ')} SUPPORTER FORMATION Build your own XI at ${shareAddress} …`;
  const faces = [`800 40px ${display}`, `500 30px ${body}`, `600 30px ${body}`];
  const sample = `${text} ${text.toLocaleUpperCase('en')}`;
  const [turf] = await Promise.all([loadTurf(), ...faces.map((face) => document.fonts.load(face, sample))]);
  await document.fonts.ready;
  if (!faces.every((face) => document.fonts.check(face, sample))) throw new Error('The fonts did not load');
  // A browser can report a face as loaded a moment before a canvas will draw with it. Measure with the
  // face against a plain fallback until the two differ, so the image is never drawn in the wrong typeface.
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) throw new Error('This browser could not start drawing');
  const applied = (family: string, weight: number) => {
    probe.font = `${weight} 80px ${family}, monospace`;
    const width = probe.measureText('MANCHESTER United 0123456789').width;
    probe.font = `${weight} 80px monospace`;
    return Math.abs(width - probe.measureText('MANCHESTER United 0123456789').width) > 1;
  };
  for (let waited = 0; !(applied(display, 800) && applied(body, 600) && applied(body, 500)); waited += 50) {
    if (waited >= 3000) throw new Error('The fonts were not ready for drawing');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return { turf };
}

function pill(ctx: CanvasRenderingContext2D, box: Box) {
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, box.h / 2);
}

function drawPitch(ctx: CanvasRenderingContext2D, pitch: Box, turf: CanvasImageSource) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(pitch.x, pitch.y, pitch.w, pitch.h);
  ctx.clip();
  // The texture covers the box without being stretched.
  const source = turf as HTMLImageElement;
  const scale = Math.max(pitch.w / source.width, pitch.h / source.height);
  ctx.drawImage(turf, pitch.x + (pitch.w - source.width * scale) / 2, pitch.y + (pitch.h - source.height * scale) / 2, source.width * scale, source.height * scale);
  const band = pitch.h / 12;
  for (let index = 0; index < 12; index++) {
    ctx.fillStyle = index % 2 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.05)';
    ctx.fillRect(pitch.x, pitch.y + pitch.h - (index + 1) * band, pitch.w, band + 1);
  }
  const light = ctx.createRadialGradient(pitch.x + pitch.w / 2, pitch.y + pitch.h * 0.55, 0, pitch.x + pitch.w / 2, pitch.y + pitch.h * 0.55, Math.max(pitch.w, pitch.h) * 0.72);
  light.addColorStop(0, 'rgba(255,255,215,.12)');
  light.addColorStop(1, 'rgba(0,0,0,.32)');
  ctx.fillStyle = light;
  ctx.fillRect(pitch.x, pitch.y, pitch.w, pitch.h);

  // Markings: a 68 × 105 m pitch, stretched to the box. Circles keep the width's scale so they stay round.
  const lines = { x: pitch.x + pitch.w * 0.05, y: pitch.y + pitch.h * 0.03, w: pitch.w * 0.9, h: pitch.h * 0.94 };
  const mx = lines.w / 68;
  const my = lines.h / 105;
  const centre = lines.x + lines.w / 2;
  ctx.strokeStyle = colour.line;
  ctx.fillStyle = colour.line;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'miter';
  ctx.strokeRect(lines.x, lines.y, lines.w, lines.h);
  ctx.beginPath();
  ctx.moveTo(lines.x, lines.y + lines.h / 2);
  ctx.lineTo(lines.x + lines.w, lines.y + lines.h / 2);
  ctx.stroke();
  const radius = 9.15 * mx;
  ctx.beginPath();
  ctx.arc(centre, lines.y + lines.h / 2, radius, 0, Math.PI * 2);
  ctx.stroke();
  const dot = (y: number) => { ctx.beginPath(); ctx.arc(centre, y, 5, 0, Math.PI * 2); ctx.fill(); };
  dot(lines.y + lines.h / 2);
  for (const end of [-1, 1]) {
    // end -1 is the far goal at the top, 1 the team's own goal at the bottom.
    const goalLine = end < 0 ? lines.y : lines.y + lines.h;
    const into = -end;
    ctx.strokeRect(centre - 20.16 * mx, Math.min(goalLine, goalLine + into * 16.5 * my), 40.32 * mx, 16.5 * my);
    ctx.strokeRect(centre - 9.16 * mx, Math.min(goalLine, goalLine + into * 5.5 * my), 18.32 * mx, 5.5 * my);
    const spot = goalLine + into * 11 * my;
    dot(spot);
    const reach = Math.acos(Math.min(1, (5.5 * my) / radius));
    const facing = into > 0 ? Math.PI / 2 : -Math.PI / 2;
    ctx.beginPath();
    ctx.arc(centre, spot, radius, facing - reach, facing + reach);
    ctx.stroke();
    // Goal frame behind the line.
    ctx.strokeRect(centre - 3.66 * mx, Math.min(goalLine, goalLine - into * 14), 7.32 * mx, 14);
    for (const side of [-1, 1]) {
      const corner = side < 0 ? lines.x : lines.x + lines.w;
      const start = into > 0 ? (side < 0 ? 0 : Math.PI / 2) : (side < 0 ? -Math.PI / 2 : Math.PI);
      ctx.beginPath();
      ctx.arc(corner, goalLine, 16, start, start + Math.PI / 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** The Supporter XI pill: the word, then the XI disc. */
function drawLogo(ctx: CanvasRenderingContext2D, right: number, y: number, height: number) {
  const size = Math.round(height * 0.55);
  ctx.font = `800 ${size}px ${display}`;
  const word = 'SUPPORTER';
  const disc = height / 2 - 5;
  const wordWidth = ctx.measureText(word).width;
  const width = Math.ceil(22 + wordWidth + 10 + disc * 2 + 5);
  const box = { x: right - width, y, w: width, h: height };
  pill(ctx, box);
  ctx.fillStyle = colour.red;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colour.white;
  ctx.stroke();
  const cx = right - 5 - disc;
  const cy = y + height / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, disc, 0, Math.PI * 2);
  ctx.fillStyle = colour.white;
  ctx.fill();
  // The XI is three strokes (brand.tsx), drawn in a 36 × 28 box.
  const k = (disc * 1.2) / 36;
  ctx.save();
  ctx.translate(cx - 18 * k, cy - 14 * k);
  ctx.scale(k, k);
  ctx.strokeStyle = tokenValue('club-mark');
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'butt';
  ctx.stroke(new Path2D('M4 2L18 26M18 2L4 26M31.5 2V26'));
  ctx.restore();
  ctx.fillStyle = colour.white;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${size}px ${display}`;
  ctx.fillText(word, box.x + 22, cy + capHeight(ctx) / 2);
}

const capHeight = (ctx: CanvasRenderingContext2D) => ctx.measureText('H').actualBoundingBoxAscent;

// The desktop builder's field markings (pitch-stage.tsx), in a 1050 × 680 box.
const markings = 'M525 2V678M2 138.5H165V541.5H2M2 248.5H55V431.5H2M165 267A91.5 91.5 0 0 1 165 413M1048 138.5H885V541.5H1048M1048 248.5H995V431.5H1048M885 267A91.5 91.5 0 0 0 885 413M2 14A12 12 0 0 0 14 2M1036 2A12 12 0 0 0 1048 14M2 666A12 12 0 0 1 14 678M1036 678A12 12 0 0 1 1048 666';

/** The builder's turf slab seen from above, before it is tilted: texture, mowing stripes both ways,
    worn patches, light, the far half fading into the dark, and the markings. */
function flatPlane(turf: CanvasImageSource): HTMLCanvasElement {
  const detail = 2;
  const canvas = document.createElement('canvas');
  canvas.width = plane.width * detail;
  canvas.height = plane.height * detail;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not start drawing');
  ctx.scale(detail, detail);
  const { width, height } = plane;
  const source = turf as HTMLImageElement;
  const cover = Math.max(width / source.width, height / source.height);
  ctx.drawImage(turf, (width - source.width * cover) / 2, (height - source.height * cover) / 2, source.width * cover, source.height * cover);
  for (let x = plane.insetX - 122.2, index = 0; x < width; x += 61.1, index++) { ctx.fillStyle = index % 2 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.07)'; ctx.fillRect(x, 0, 61.1, height); }
  for (let y = plane.insetY - 115.2, index = 0; y < height; y += 57.6, index++) { ctx.fillStyle = index % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.1)'; ctx.fillRect(0, y, width, 57.6); }
  const ellipse = (cx: number, cy: number, rx: number, ry: number, stops: [number, string][]) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    for (const [at, value] of stops) gradient.addColorStop(at, value);
    ctx.fillStyle = gradient;
    ctx.fillRect(-width, -height, width * 2, height * 2);
    ctx.restore();
  };
  const worn: [number, string][] = [[0, 'rgba(140,120,60,.38)'], [0.7, 'rgba(140,120,60,0)']];
  ellipse(75, 380, 45, 80, worn);
  ellipse(width - 75, 380, 45, 80, worn);
  ellipse(580, 380, 60, 60, [[0, 'rgba(140,120,60,.22)'], [0.7, 'rgba(140,120,60,0)']]);
  ellipse(width / 2, height * 0.66, width * 0.62, height * 0.62, [[0, 'rgba(255,255,215,.2)'], [0.88, 'rgba(0,0,0,.28)'], [1, 'rgba(0,0,0,.28)']]);
  const fade = ctx.createLinearGradient(0, 0, 0, height * 0.52);
  fade.addColorStop(0, 'rgba(12,14,13,.58)');
  fade.addColorStop(1, 'rgba(12,14,13,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, width, height);
  ctx.translate(plane.insetX, plane.insetY);
  ctx.scale((width - plane.insetX * 2) / 1050, (height - plane.insetY * 2) / 680);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = colour.line;
  ctx.fillStyle = colour.line;
  ctx.lineWidth = 3.5;
  ctx.strokeRect(2, 2, 1046, 676);
  ctx.stroke(new Path2D(markings));
  ctx.beginPath();
  ctx.arc(525, 340, 91.5, 0, Math.PI * 2);
  ctx.stroke();
  for (const x of [110, 525, 940]) { ctx.beginPath(); ctx.arc(x, 340, 3.5, 0, Math.PI * 2); ctx.fill(); }
  return canvas;
}

/** Tilts the flat slab away from the viewer exactly as the builder's CSS does (52° about the near edge,
    perspective 1500), one row of pixels at a time, then adds the soil edge, goals and corner flags. */
function drawPerspectivePitch(ctx: CanvasRenderingContext2D, centre: number, nearY: number, turf: CanvasImageSource) {
  const { k } = landscape;
  const flat = flatPlane(turf);
  const detail = flat.width / plane.width;
  const angle = (plane.tilt * Math.PI) / 180;
  const depthAt = (rise: number) => (rise * plane.perspective) / (Math.cos(angle) * plane.perspective - rise * Math.sin(angle));
  const scaleAt = (depth: number) => plane.perspective / (plane.perspective + depth * Math.sin(angle));
  const farRise = plane.height * Math.cos(angle) * scaleAt(plane.height);
  // The slab's shadow on the floor.
  ctx.save();
  ctx.translate(centre, nearY + 36 * k);
  ctx.scale(660 * k, 46 * k);
  const floor = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  floor.addColorStop(0, 'rgba(0,0,0,.85)');
  floor.addColorStop(0.6, 'rgba(0,0,0,.7)');
  floor.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = floor;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
  const rows = Math.ceil(farRise * k);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  for (let row = 0; row < rows; row++) {
    const near = depthAt(row / k);
    const far = depthAt(Math.min((row + 1) / k, farRise));
    const scale = scaleAt((near + far) / 2);
    const sourceTop = Math.max(0, (plane.height - far) * detail);
    const sourceHeight = Math.max(1, (far - near) * detail);
    ctx.drawImage(flat, 0, sourceTop, flat.width, Math.min(sourceHeight, flat.height - sourceTop), centre - (plane.width / 2) * k * scale, nearY - row - 1, plane.width * k * scale, 1.5);
  }
  const soil = ctx.createLinearGradient(0, nearY, 0, nearY + 36 * k);
  for (const [at, value] of [[0, '#3c7a33'], [4, '#3c7a33'], [4, '#24451f'], [7, '#24451f'], [7, '#4a3423'], [15, '#4a3423'], [15, '#3a281b'], [24, '#3a281b'], [24, '#2a1d14'], [36, '#2a1d14']] as const) soil.addColorStop(at / 36, value);
  ctx.fillStyle = soil;
  ctx.fillRect(centre - (plane.width / 2) * k, nearY, plane.width * k, 36 * k);
  // Goals and flags are flat drawings in the builder's 1160 × 760 overlay.
  ctx.save();
  ctx.translate(centre - (plane.width / 2) * k, nearY - plane.height * k);
  ctx.scale(k, k);
  ctx.lineJoin = 'round';
  for (const net of ['M113.9 560.1L128.9 528.9L110.9 549.3L95.3 581.2Z M113.9 560.1L95.3 581.2L113.9 581.2Z', 'M1046.1 560.1L1031.1 528.9L1049.1 549.3L1064.7 581.2Z M1046.1 560.1L1064.7 581.2L1046.1 581.2Z']) {
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.fill(new Path2D(net));
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.lineWidth = 1;
    ctx.stroke(new Path2D(net));
  }
  ctx.strokeStyle = colour.white;
  ctx.lineWidth = 3;
  ctx.stroke(new Path2D('M113.9 581.2V560.1L128.9 528.9V549.3M1046.1 581.2V560.1L1031.1 528.9V549.3'));
  ctx.strokeStyle = '#e9ebe3';
  ctx.lineWidth = 1.5;
  ctx.stroke(new Path2D('M181.9 436.4V418M978.1 436.4V418M39.7 739.4V712M1120.3 739.4V712'));
  ctx.fillStyle = colour.red;
  ctx.fill(new Path2D('M181.9 418l8 3l-8 3ZM978.1 418l8 3l-8 3ZM39.7 712l12 4.5l-12 4.5ZM1120.3 712l12 4.5l-12 4.5Z'));
  ctx.restore();
}

/** Draws one format. The canvas must already be exactly the format's size. */
export function drawShareImage(ctx: CanvasRenderingContext2D, format: ShareFormat, snapshot: ShareSnapshot, assets: ShareAssets) {
  const f = frame(format);
  const measureWith = (font: (size: number) => string): Measure => (text, size) => { ctx.font = font(size); return ctx.measureText(text).width; };
  const headlineWidth = measureWith((size) => `800 ${size}px ${display}`);
  ctx.fillStyle = colour.page;
  ctx.fillRect(0, 0, f.width, f.height);
  ctx.textBaseline = 'alphabetic';

  // Headline: the club in red, "v" in grey, the opponent in white. No other match details are printed.
  const club = 'MANCHESTER UNITED';
  const runs = (parts: [string, string][], y: number) => {
    let x = f.width / 2 - ctx.measureText(parts.map(([text]) => text).join('')).width / 2;
    ctx.textAlign = 'left';
    for (const [text, fill] of parts) { ctx.fillStyle = fill; ctx.fillText(text, x, y); x += ctx.measureText(text).width; }
  };
  const opponent = snapshot.opponent.toLocaleUpperCase('en').trim().replace(/\s+/g, ' ');
  let baseline = f.top;
  let oneLine = 0;
  // Landscape has the width for the whole fixture on one line when the opponent is short enough.
  if (format === 'landscape') for (let size = 112; size >= 88 && !oneLine; size -= 4) if (headlineWidth(`${club} V ${opponent}`, size) <= f.inner) oneLine = size;
  if (oneLine) {
    ctx.font = `800 ${oneLine}px ${display}`;
    baseline += capHeight(ctx);
    runs([[`${club} `, colour.red], ['V ', colour.v], [opponent, colour.white]], baseline);
  } else {
    const headline = fitHeadline(snapshot.opponent, f.inner, f.headline, headlineWidth);
    ctx.font = `800 ${headline.size}px ${display}`;
    baseline += capHeight(ctx);
    runs([[club, colour.red]], baseline);
    headline.lines.forEach((line, index) => {
      baseline += Math.round(headline.size * 0.9);
      runs(index ? [[line, colour.white]] : [['V ', colour.v], [line.slice(2), colour.white]], baseline);
    });
  }

  if (format === 'landscape') {
    // The desktop builder's pitch, with each player as its pill: number disc on the spot, name beside it.
    const nearY = landscapeNearEdge(baseline + 20, f.footer.y - 10);
    drawPerspectivePitch(ctx, f.width / 2, nearY, assets.turf);
    const m = landscape.pill;
    const placed = placePills(snapshot.players, f.width, nearY, measureWith((size) => `600 ${size}px ${body}`));
    for (const player of placed) {
      ctx.save();
      ctx.translate(player.box.x + player.box.w / 2, player.box.y + player.box.h + 6 * m);
      ctx.scale(player.box.w / 2 + 6 * m, 9 * m);
      const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      shadow.addColorStop(0, 'rgba(0,0,0,.55)');
      shadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadow;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
    for (const player of [...placed].sort((a, b) => a.cy - b.cy)) {
      const inner = { x: player.box.x + m, y: player.box.y + m, w: player.box.w - 2 * m, h: player.box.h - 2 * m };
      pill(ctx, inner);
      ctx.fillStyle = colour.red;
      ctx.fill();
      ctx.lineWidth = 2 * m;
      ctx.strokeStyle = colour.white;
      ctx.stroke();
      const disc = player.side === 'right' ? player.box.x + 16 * m : player.box.x + player.box.w - 16 * m;
      ctx.beginPath();
      ctx.arc(disc, player.cy, 12 * m, 0, Math.PI * 2);
      ctx.fillStyle = colour.white;
      ctx.fill();
      ctx.textAlign = 'center';
      if (player.number !== null) {
        ctx.font = `800 ${17 * m}px ${display}`;
        ctx.fillStyle = colour.deep;
        ctx.fillText(String(player.number), disc, player.cy + capHeight(ctx) / 2);
      }
      ctx.font = `600 ${14 * m}px ${body}`;
      ctx.fillStyle = colour.white;
      ctx.textAlign = player.side === 'right' ? 'left' : 'right';
      ctx.fillText(player.label, player.side === 'right' ? disc + 20 * m : disc - 20 * m, player.cy + capHeight(ctx) / 2);
    }
  } else {
    // Bird's-eye pitch: the shirt number in a white disc on the spot, the short name on a red tag beneath.
    const marker = markerFor(format);
    const pitchTop = baseline + (format === 'square' ? 30 : 44);
    const pitch = { x: f.side, y: pitchTop, w: f.inner, h: f.pitchBottom - pitchTop };
    drawPitch(ctx, pitch, assets.turf);
    const placed = placePlayers(snapshot.players, pitch, f.width, measureWith((size) => `600 ${size}px ${body}`), marker);
    for (const player of placed) {
      // A soft shadow on the grass under the name, wider for longer names.
      ctx.save();
      ctx.translate(player.cx, player.cy + marker.disc + marker.gap + marker.tag);
      ctx.scale(Math.max(1, player.tagWidth / 130), 0.36);
      const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
      shadow.addColorStop(0, 'rgba(0,0,0,.5)');
      shadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadow;
      ctx.fillRect(-80, -80, 160, 160);
      ctx.restore();
    }
    ctx.textAlign = 'center';
    for (const player of [...placed].sort((a, b) => a.cy - b.cy)) {
      const tag = { x: player.cx - player.tagWidth / 2, y: player.cy + marker.disc + marker.gap, w: player.tagWidth, h: marker.tag };
      pill(ctx, tag);
      ctx.fillStyle = colour.red;
      ctx.fill();
      ctx.font = `600 ${player.size}px ${body}`;
      ctx.fillStyle = colour.white;
      ctx.fillText(player.label, player.cx, tag.y + tag.h / 2 + capHeight(ctx) / 2);
      ctx.beginPath();
      ctx.arc(player.cx, player.cy, marker.disc - 2, 0, Math.PI * 2);
      ctx.fillStyle = colour.white;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = colour.red;
      ctx.stroke();
      if (player.number !== null) {
        const digits = String(player.number);
        ctx.font = `800 ${digits.length > 1 ? marker.number : Math.round(marker.number * 1.1)}px ${display}`;
        ctx.fillStyle = colour.deep;
        ctx.fillText(digits, player.cx, player.cy + capHeight(ctx) / 2);
      }
    }
  }

  // Footer: the formation on the left, where to build your own in the middle, the mark on the right.
  const foot = f.footer.y + f.footer.h;
  ctx.textAlign = 'left';
  ctx.font = `600 20px ${body}`;
  ctx.fillStyle = colour.quiet;
  ctx.fillText('FORMATION', f.side, f.footer.y + 14);
  ctx.font = `800 40px ${display}`;
  ctx.fillStyle = colour.text;
  ctx.fillText(snapshot.formation.toLocaleUpperCase('en'), f.side, foot);
  ctx.textAlign = 'center';
  ctx.font = `500 20px ${body}`;
  ctx.fillStyle = colour.soft;
  ctx.fillText('Build your own XI at', f.width / 2, f.footer.y + 14);
  ctx.font = `800 40px ${display}`;
  ctx.fillStyle = colour.yellow;
  ctx.fillText(shareAddress.toLocaleUpperCase('en'), f.width / 2, foot);
  drawLogo(ctx, f.width - f.side, f.footer.y, f.footer.h);
}

/** A real PNG at exactly the format's size. Rejects if assets, drawing or encoding fail. */
export async function renderSharePng(snapshot: ShareSnapshot, format: ShareFormat): Promise<Blob> {
  const assets = await loadShareAssets(snapshot);
  const { width, height } = shareFormats[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not start drawing');
  drawShareImage(ctx, format, snapshot, assets);
  // Encoded in one step rather than with canvas.toBlob, whose idle-time encoding can stall in Chromium.
  const data = canvas.toDataURL('image/png');
  const prefix = 'data:image/png;base64,';
  if (!data.startsWith(prefix)) throw new Error('The image could not be encoded');
  const bytes = Uint8Array.from(atob(data.slice(prefix.length)), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: 'image/png' });
}
