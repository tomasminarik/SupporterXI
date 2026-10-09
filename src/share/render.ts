import { fitHeadline, frame, marker, placePlayers, type Box, type Measure } from './layout';
import { shareFormats, type ShareFormat, type ShareSnapshot } from './snapshot';

// Draws the share image on a canvas from a snapshot (architecture record: browser canvas, bundled
// fonts, original local assets). Nothing is captured from the page and nothing leaves the browser.
const display = '"Big Shoulders Display"';
const body = 'Barlow';
const colour = { page: '#0c0e0d', red: '#da362e', deep: '#b3261e', white: '#ffffff', text: '#f3f1ea', soft: '#b9bcb2', quiet: '#9a9d94', v: '#8a8d86', slash: '#5a5e58', line: '#f4f6ee' };

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
  const text = `MANCHESTER UNITED V ${snapshot.opponent} ${snapshot.formation} ${snapshot.context.join(' ')} ${snapshot.kickoff} ${snapshot.players.map((player) => `${player.name} ${player.number ?? ''}`).join(' ')} SUPPORTER FORMATION /…`;
  const faces = [`800 40px ${display}`, `500 30px ${body}`, `600 30px ${body}`];
  const sample = `${text} ${text.toLocaleUpperCase('en')}`;
  const [turf] = await Promise.all([loadTurf(), ...faces.map((face) => document.fonts.load(face, sample))]);
  if (!faces.every((face) => document.fonts.check(face, sample))) throw new Error('The fonts did not load');
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

function drawLogo(ctx: CanvasRenderingContext2D, right: number, y: number, height: number) {
  const size = Math.round(height * 0.55);
  ctx.font = `800 ${size}px ${display}`;
  const word = 'SUPPORTER';
  const disc = height / 2 - 5;
  const width = Math.ceil(5 + disc * 2 + 10 + ctx.measureText(word).width + 22);
  const box = { x: right - width, y, w: width, h: height };
  pill(ctx, box);
  ctx.fillStyle = colour.red;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colour.white;
  ctx.stroke();
  const cx = box.x + 5 + disc;
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
  ctx.strokeStyle = '#c42a23';
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'butt';
  ctx.stroke(new Path2D('M4 2L18 26M18 2L4 26M31.5 2V26'));
  ctx.restore();
  ctx.fillStyle = colour.white;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${size}px ${display}`;
  ctx.fillText(word, cx + disc + 10, cy + capHeight(ctx) / 2);
}

const capHeight = (ctx: CanvasRenderingContext2D) => ctx.measureText('H').actualBoundingBoxAscent;

/** Draws one format. The canvas must already be exactly the format's size. */
export function drawShareImage(ctx: CanvasRenderingContext2D, format: ShareFormat, snapshot: ShareSnapshot, assets: ShareAssets) {
  const f = frame(format);
  const measureWith = (font: (size: number) => string): Measure => (text, size) => { ctx.font = font(size); return ctx.measureText(text).width; };
  ctx.fillStyle = colour.page;
  ctx.fillRect(0, 0, f.width, f.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Headline: the club in red, "v" in grey, the opponent in white.
  const headline = fitHeadline(snapshot.opponent, f.inner, f.headline, measureWith((size) => `800 ${size}px ${display}`));
  ctx.font = `800 ${headline.size}px ${display}`;
  const cap = capHeight(ctx);
  const leading = Math.round(headline.size * 0.9);
  let baseline = f.top + cap;
  ctx.fillStyle = colour.red;
  ctx.fillText('MANCHESTER UNITED', f.width / 2, baseline);
  headline.lines.forEach((line, index) => {
    baseline += leading;
    if (index > 0) { ctx.fillStyle = colour.white; ctx.fillText(line, f.width / 2, baseline); return; }
    const rest = line.slice(2);
    const start = f.width / 2 - ctx.measureText(line).width / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = colour.v;
    ctx.fillText('V', start, baseline);
    ctx.fillStyle = colour.white;
    ctx.fillText(rest, start + ctx.measureText('V ').width, baseline);
    ctx.textAlign = 'center';
  });

  // Details: competition / round / venue / kickoff, on two lines when one is not enough.
  const details = (parts: readonly string[], y: number, size: number) => {
    ctx.font = `500 ${size}px ${body}`;
    const slash = '  /  ';
    const total = ctx.measureText(parts.join(slash)).width;
    let x = f.width / 2 - total / 2;
    ctx.textAlign = 'left';
    parts.forEach((part, index) => {
      if (index) { ctx.fillStyle = colour.slash; ctx.fillText(slash, x, y); x += ctx.measureText(slash).width; }
      ctx.fillStyle = colour.soft;
      ctx.fillText(part, x, y);
      x += ctx.measureText(part).width;
    });
    ctx.textAlign = 'center';
  };
  const detailWidth = measureWith((size) => `500 ${size}px ${body}`);
  const fitSize = (parts: readonly string[]) => { let size = 30; while (size > 20 && detailWidth(parts.join('  /  '), size) > f.inner) size -= 1; return size; };
  const all = [...snapshot.context, snapshot.kickoff];
  baseline += 56;
  if (detailWidth(all.join('  /  '), 30) <= f.inner || !snapshot.context.length) details(all, baseline, fitSize(all));
  else {
    details(snapshot.context, baseline, fitSize(snapshot.context));
    baseline += 42;
    details([snapshot.kickoff], baseline, fitSize([snapshot.kickoff]));
  }

  const pitchTop = baseline + 34;
  const pitch = { x: f.side, y: pitchTop, w: f.inner, h: f.pitchBottom - pitchTop };
  drawPitch(ctx, pitch, assets.turf);

  // Players: the shirt number in a white disc on the spot, the short name on a red tag beneath.
  const placed = placePlayers(snapshot.players, pitch, f.width, measureWith((size) => `600 ${size}px ${body}`));
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
      ctx.font = `800 ${digits.length > 1 ? 40 : 44}px ${display}`;
      ctx.fillStyle = colour.deep;
      ctx.fillText(digits, player.cx, player.cy + capHeight(ctx) / 2);
    }
  }

  // Footer: the formation on the left, the Supporter XI mark on the right.
  ctx.textAlign = 'left';
  ctx.font = `600 20px ${body}`;
  ctx.fillStyle = colour.quiet;
  ctx.fillText('FORMATION', f.side, f.footer.y + 14);
  ctx.font = `800 40px ${display}`;
  ctx.fillStyle = colour.text;
  ctx.fillText(snapshot.formation.toLocaleUpperCase('en'), f.side, f.footer.y + f.footer.h);
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
