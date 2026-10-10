// Draws the link-preview image and the home-screen icon with the site's own fonts and colours, so they match
// the design system. Run `node scripts/generate-social-images.mjs` after changing the brand; the results are
// committed. Nothing official appears: no crest, kit or photograph.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const font = (file) => `url(data:font/woff2;base64,${readFileSync(new URL(`../public/fonts/${file}`, import.meta.url)).toString('base64')}) format('woff2')`;
const club = /name: '([^']+)'/.exec(readFileSync(new URL('../src/design/club.ts', import.meta.url), 'utf8'))[1];
const xi = '<svg viewBox="0 0 36 28"><path d="M5.5 1L17.5 27M17.5 1L5.5 27M30.5 1V27" fill="none" stroke="currentColor" stroke-width="8.5"/></svg>';
// A 4-3-3 seen from above, as percentages of the pitch.
const spots = [[50, 90], [14, 68], [38, 72], [62, 72], [86, 68], [26, 46], [50, 50], [74, 46], [18, 22], [50, 16], [82, 22]];

const preview = `<!doctype html><style>
@font-face { font-family: Display; font-weight: 800; src: ${font('big-shoulders-display-latin-800-normal.woff2')}; }
@font-face { font-family: Body; font-weight: 500; src: ${font('barlow-latin-500-normal.woff2')}; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #0c0e0d; color: #f3f1ea; font: 500 28px/1.35 Body; display: flex; }
.words { flex: 1; padding: 64px 0 64px 72px; display: flex; flex-direction: column; }
.logo { align-self: flex-start; display: flex; align-items: center; gap: 12px; height: 60px; padding: 0 5px 0 24px; border-radius: 30px; background: #da362e; border: 3px solid #fff; color: #fff; font: 800 33px/1 Display; text-transform: uppercase; }
.logo span { width: 44px; height: 44px; border-radius: 50%; background: #fff; color: #c42a23; display: grid; place-items: center; }
.logo svg { width: 26px; height: 20px; }
h1 { margin-top: auto; font: 800 86px/.94 Display; text-transform: uppercase; color: #fff; }
h1 b { display: block; color: #da362e; font-weight: 800; }
p { margin-top: 22px; color: #b9bcb2; }
.site { margin-top: 10px; color: #9a9d94; font-size: 24px; }
.pitch { position: relative; width: 372px; height: 502px; margin: 64px 72px 64px 40px; background: #171a18; border: 3px solid #3a3e3a; }
.pitch::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; border-top: 3px solid #3a3e3a; }
.pitch::after { content: ''; position: absolute; left: 50%; top: 50%; width: 110px; height: 110px; margin: -55px; border: 3px solid #3a3e3a; border-radius: 50%; }
.box { position: absolute; left: 24%; right: 24%; height: 16%; border: 3px solid #3a3e3a; }
.box.top { top: -3px; } .box.bottom { bottom: -3px; }
i { position: absolute; z-index: 1; width: 40px; height: 40px; margin: -20px; border-radius: 50%; background: #da362e; border: 3px solid #fff; box-shadow: 0 8px 14px rgba(0, 0, 0, .4); }
</style><div class="words"><div class="logo">Supporter<span>${xi}</span></div>
<h1>Pick your<b>${club}</b>starting XI</h1><p>The lineup builder for the next match.</p><p class="site">supporterxi.com</p></div>
<div class="pitch"><div class="box top"></div><div class="box bottom"></div>${spots.map(([x, y]) => `<i style="left:${x}%;top:${y}%"></i>`).join('')}</div>`;

// Home screens round the corners themselves, so the icon fills its square.
const icon = `<!doctype html><style>* { margin: 0; } body { width: 180px; height: 180px; background: #da362e; color: #fff; display: grid; place-items: center; } svg { width: 104px; height: 81px; }</style>${xi}`;

const browser = await chromium.launch();
for (const [html, width, height, file] of [[preview, 1200, 630, 'opengraph-image.png'], [icon, 180, 180, 'apple-icon.png']]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(`../src/app/${file}`, import.meta.url).pathname });
  await page.close();
}
await browser.close();
