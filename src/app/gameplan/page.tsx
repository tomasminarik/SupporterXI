import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo, XiMark } from '../../design/brand';
import { Button, CloseButton } from '../../design/button';
import { PillBody, RoleTag } from '../../design/player-pill';
import { PanelDemo, TileDemo } from './demos';
import Notice from '../../design/notice';
import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';
import { breakpoints, groups, type Token, type TokenGroup } from '../../design/tokens';
import './gameplan.css';

// The design system's reference page. It is public but never indexed (user decision, 10 October 2026);
// the rest of the site keeps the indexing set in the root layout.
export const metadata: Metadata = {
  title: 'Gameplan — the Supporter XI design system',
  description: 'The colours, type, spacing, motion and rules Supporter XI is built from.',
  robots: { index: false, follow: false },
};

const name = (token: Token) => `--sx-${token.name}`;
const ofKind = (kind: TokenGroup['kind']) => groups.filter((group) => group.kind === kind);
const only = (kind: TokenGroup['kind']) => ofKind(kind).flatMap((group) => group.tokens);

function Swatches({ group }: { group: TokenGroup }) {
  return <div className="gp-group">
    <h3>{group.title}{group.layer === 'club' && <span> Club layer</span>}</h3>
    <ul className="gp-swatches">{group.tokens.map((token) => <li key={token.name}>
      <span className="gp-swatch" style={{ background: `var(${name(token)})` }} aria-hidden="true" />
      <code>{name(token)}</code><span className="gp-value">{token.value}</span><span className="gp-use">{token.use}</span>
    </li>)}</ul>
  </div>;
}

function Rows({ tokens, sample }: { tokens: Token[]; sample: (token: Token) => React.ReactNode }) {
  return <ul className="gp-rows">{tokens.map((token) => <li key={token.name}>
    <div className="gp-sample">{sample(token)}</div>
    <div className="gp-meta"><code>{name(token)}</code><span className="gp-value">{token.value}</span><span className="gp-use">{token.use}</span></div>
  </li>)}</ul>;
}

const states: { state: string; title: string; cue: string; disabled?: boolean; pressed?: boolean }[] = [
  { state: 'rest', title: 'Rest', cue: 'Surface fill, quiet border.' },
  { state: 'hover', title: 'Hover', cue: 'The border turns to the text colour. Nothing moves.' },
  { state: 'selected', title: 'Selected', cue: 'White fill, dark text. The same on cards, chips and choices.', pressed: true },
  { state: 'target', title: 'Target', cue: 'Dashed white outline: "this is where it would go".' },
  { state: 'focus', title: 'Keyboard focus', cue: 'Solid white ring, 3px, with a 3px gap. Never removed.' },
  { state: 'disabled', title: 'Disabled', cue: 'Dimmed text and no pointer. Used sparingly; say why nearby.', disabled: true },
  { state: 'unavailable', title: 'Unavailable', cue: 'Darker club colour and a dashed ring, plus a written tag.' },
];

const rules = [
  ['One club colour.', 'Red marks the club and the things you pick. It is never used for errors alone: a problem also gets a mark and words.'],
  ['Yellow means share.', 'The action colour appears on the share button and the download step, nowhere else.'],
  ['Square panels, round people.', 'Buttons, cards, panels and dialogs have square corners. Only players, numbers and marks are round.'],
  ['Display type is uppercase.', 'Big Shoulders Display is for the headline, headings and numbers. Sentences are set in Barlow.'],
  ['White means chosen.', 'A selected card, chip or choice turns white with dark text. Colour is never the only signal: state is also in the markup.'],
  ['Every drag has another way.', 'Anything that can be dragged can also be done by click or tap and by keyboard.'],
  ['Quick and crisp.', 'Motion is short, uses one curve, and is switched off for visitors who ask for reduced motion.'],
  ['44px to touch.', 'No button or field is shorter than 44px.'],
  ['Nothing official.', 'No club crests, licensed kits or player photographs, on the site or in share images.'],
];

export default function Gameplan() {
  return <div className="sx gp">
    <a className="sx-skip" href="#main">Skip to content</a>
    <SiteHeader share={false} />
    <main id="main" tabIndex={-1} className="gp-main">
      <header className="gp-intro">
        <p className="sx-label">Design system</p>
        <h1>Gameplan</h1>
        <p>What Supporter XI is built from: the colours, type, spacing and motion, and the rules for using them. This page is drawn from the same values the site uses, so it always shows what is live.</p>
        <p><Link href="/">Open the lineup builder</Link></p>
        <nav aria-label="On this page"><ul className="gp-nav">{['Brand', 'Colour', 'Type', 'Spacing', 'Motion', 'Depth', 'States', 'Components', 'Rules'].map((title) => <li key={title}><a href={`#${title.toLowerCase().replaceAll(' ', '-')}`}>{title}</a></li>)}</ul></nav>
      </header>

      <section aria-labelledby="brand">
        <h2 id="brand">Brand</h2>
        <p className="gp-lead">The logo is the player pill: the word, then the XI disc. Below 32px tall only the disc is used, with heavier strokes; at 24px and below it loses its white ring.</p>
        <div className="gp-brand">
          <figure><Logo /><figcaption>Full logo, 40px</figcaption></figure>
          {[32, 24, 16].map((size) => <figure key={size}>
            <span className="gp-disc" data-ring={size > 24 ? 'true' : undefined} style={{ width: size, height: size }} role="img" aria-label={`Supporter XI disc at ${size} pixels`}><XiMark width={size * 0.56} height={size * 0.44} heavy /></span>
            <figcaption>Disc, {size}px</figcaption>
          </figure>)}
        </div>
      </section>

      <section aria-labelledby="colour">
        <h2 id="colour">Colour</h2>
        <p className="gp-lead">Colours are named by the job they do. The club layer is everything that would change for another club; the rest is the same whoever you support.</p>
        {ofKind('colour').map((group) => <Swatches key={group.title} group={group} />)}
      </section>

      <section aria-labelledby="type">
        <h2 id="type">Type</h2>
        <p className="gp-lead">Two typefaces, both hosted with the site.</p>
        <Rows tokens={only('font')} sample={(token) => <span className={token.name === 'font-display' ? 'gp-display' : undefined} style={{ fontFamily: `var(${name(token)})`, fontSize: 30 }}>{token.name === 'font-display' ? 'Pick your striker' : 'Pick your striker for the next match'}</span>} />
        <div className="gp-group"><h3>Sizes</h3>
          <Rows tokens={only('text')} sample={(token) => token.name.startsWith('text-display')
            ? <span className="gp-display" style={{ fontSize: `var(${name(token)})` }}>{token.name === 'text-display-l' ? '10' : 'Matchday'}</span>
            : <span className={token.name === 'text-label' ? 'sx-label' : undefined} style={{ fontSize: `var(${name(token)})` }}>{token.name === 'text-label' ? 'Formation' : 'Premier League / Matchday 8 / Home'}</span>} />
        </div>
      </section>

      <section aria-labelledby="spacing">
        <h2 id="spacing">Spacing</h2>
        <p className="gp-lead">Gaps come from one scale in steps of four. Layout changes at two widths: {breakpoints.phone}px (phone header and details) and {breakpoints.flatPitch}px (the pitch turns from perspective to a portrait view).</p>
        <Rows tokens={only('space')} sample={(token) => <span className="gp-bar" style={{ width: `var(${name(token)})` }} />} />
        <div className="gp-group"><h3>Control heights</h3>
          <Rows tokens={only('size')} sample={(token) => <span className="gp-control" style={{ height: `var(${name(token)})` }}>Button</span>} />
        </div>
      </section>

      <section aria-labelledby="motion">
        <h2 id="motion">Motion</h2>
        <p className="gp-lead">One curve and three speeds. Point at a row, or tab to it, to see its speed. Visitors who ask for reduced motion get none.</p>
        <ul className="gp-rows">{only('motion').map((token) => <li key={token.name}>
          {token.name === 'ease-crisp'
            ? <div className="gp-sample"><svg className="gp-curve" viewBox="0 0 100 60" role="img" aria-label="A curve that starts fast and lands softly"><path d="M2 58 C 21.2 12, 21.2 2, 98 2" fill="none" stroke="currentColor" strokeWidth="2" /></svg></div>
            : <button type="button" className="gp-sample gp-track" style={{ ['--gp-speed' as string]: `var(${name(token)})` }} aria-label={`Play ${token.name.replace('duration-', '')} speed`}><span className="gp-runner" /></button>}
          <div className="gp-meta"><code>{name(token)}</code><span className="gp-value">{token.value}</span><span className="gp-use">{token.use}</span></div>
        </li>)}</ul>
      </section>

      <section aria-labelledby="depth">
        <h2 id="depth">Depth</h2>
        <p className="gp-lead">Three shadows, by how far something floats above the page.</p>
        <Rows tokens={only('shadow')} sample={(token) => <span className="gp-lift" style={{ boxShadow: `var(${name(token)})` }} />} />
      </section>

      <section aria-labelledby="states">
        <h2 id="states">States</h2>
        <p className="gp-lead">One grammar for every control. Each state has a cue besides colour.</p>
        <ul className="gp-states">{states.map((item) => <li key={item.state}>
          <button type="button" className="gp-tile" data-state={item.state} disabled={item.disabled} aria-pressed={item.pressed}>{item.title}</button>
          <p>{item.cue}</p>
        </li>)}</ul>
        <p className="gp-note">Locked, from 15 minutes after kickoff: controls stay visible, lose their hover and pointer, and a notice says why.</p>
        <div className="gp-group"><h3>Focus ring</h3>
          <Rows tokens={only('focus')} sample={() => <span className="gp-control gp-focused">Button</span>} />
        </div>
      </section>

      <section aria-labelledby="components">
        <h2 id="components">Components</h2>
        <p className="gp-lead">The shared parts. The builder, the share dialog and this page all use these same ones, so what you see here is what is live.</p>
        <div className="gp-group"><h3>Buttons</h3>
          <div className="gp-buttons">
            <Button variant="primary">Primary</Button>
            <Button>Secondary</Button>
            <Button variant="quiet">Quiet</Button>
            <Button variant="action">Share your XI</Button>
            <CloseButton label="Close (example button)" />
          </div>
          <p className="gp-note">Primary confirms; secondary is the other choice; quiet is for small actions inside a heading; yellow is sharing only. The cross closes a panel, sheet or dialog.</p>
        </div>
        <div className="gp-group"><h3>Label</h3>
          <p className="sx-label">Image size</p>
          <p className="gp-note">The small uppercase line above a group of choices.</p>
        </div>
        <div className="gp-group"><h3>Tile</h3>
          <TileDemo />
          <p className="gp-note">A choice you can press: squad cards, formations, image sizes. The chosen one turns white. Try them.</p>
        </div>
        <div className="gp-group"><h3>Player pill</h3>
          <div className="gp-pills">
            <span className="gp-pill"><PillBody number={9} name="Striker" /></span>
            <span className="gp-pill"><PillBody number={6} name="Midfielder" /><span className="gp-tags"><RoleTag>Holding Midfielder</RoleTag></span></span>
            <span className="gp-pill sx-unavailable"><PillBody number={4} name="Defender" /><span className="gp-tags"><RoleTag flag>Unavailable</RoleTag></span></span>
          </div>
          <p className="gp-note">Shirt number in a white disc, then the short name. A role is written in full underneath. An unavailable player gets a darker pill, a dashed ring and a written tag. These names are placeholders.</p>
        </div>
        <div className="gp-group"><h3>Panel and option list</h3>
          <PanelDemo />
          <p className="gp-note">A panel is anything that floats above the page: the player menu, the formation picker. On phones a panel becomes a sheet fixed to the bottom of the screen, and over a dimmed page it is a dialog. Inside this one is an option list: one choice from a few, each with a line of explanation.</p>
        </div>
        <div className="gp-group"><h3>Notices</h3>
          <div className="gp-notices">
            <Notice title="For information" role="status">Something the visitor should know. Nothing is wrong.</Notice>
            <Notice tone="attention" title="Needs a decision" role="status">Something changed and the visitor chooses what happens next.</Notice>
            <Notice tone="problem" title="Something failed" role="status">What went wrong, in plain words, and what to do.</Notice>
          </div>
          <p className="gp-note">The mark&apos;s shape carries the tone as well as its colour.</p>
        </div>
      </section>

      <section aria-labelledby="rules">
        <h2 id="rules">Rules</h2>
        <dl className="gp-rules">{rules.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl>
        <p className="gp-note">Outside the system: the pitch, which is a single illustration, and the administration pages, which use their own kit. The club&apos;s colour and name are kept apart from everything else, so they could be swapped for another club.</p>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
