/* TokenKit TV pack: <tk-tv-shell>, <tk-tv-row>, <tk-tv-tile>, <tk-tv-osd> and
   <tk-tv-sidebar>. A 10-foot interface, driven by a remote, a D-pad, a gamepad or the
   arrow keys. Framework-agnostic custom elements. Import once; they define themselves
   (and do nothing on a server, where customElements is missing).

     <tk-tv-shell theme="boosty" input="keys pad" label="TV home">
       <tk-tv-sidebar label="Main menu"><a href="#home" aria-current="page">Home</a>...</tk-tv-sidebar>
       <tk-tv-row label="Films"><tk-tv-tile label="Drama" accent="violet"></tk-tv-tile>...</tk-tv-row>
       <tk-tv-osd slot="overlay" kind="volume" value="40"></tk-tv-osd>
     </tk-tv-shell>

   Tokens: every colour and size is a --tk-tv-* custom property over a theme default.
   They inherit, so a theme set on the shell reaches every tile, row and sidebar in it;
   theme="boosty|dark|light" on any element sets the defaults from there down. */
import { createRemote, verbForKey, verbForButton, stickDirection, createPadReader, VERBS, DIRECTIONS, KEY_VERBS, PAD_VERBS, REMOTE_KEY_NAMES, VERB_WORDS } from './tv-remote.mjs';
import { createFocusNav, pickNext, isAhead, rectOf } from './tv-focus.mjs';
import { sharedHub } from '../gamepad/gamepad-core.mjs';

export const THEMES = ['boosty', 'dark', 'light'];
export const ACCENTS = ['emerald', 'violet', 'amber', 'cyan', 'pink'];
export const OSD_KINDS = ['volume', 'now-playing', 'message'];

/* Colour defaults per theme. A page overrides any of them with its own --tk-tv-* value. */
const COLOURS = {
  boosty: { bg: '#07060a', surface: '#14111b', 'surface-hi': '#241f2e', ink: '#f3efff', 'ink-dim': '#bdb6cf', rule: '#3a3448', ring: '#22e4f0', 'ring-inner': '#07060a', accent: '#ff3fb4', 'osd-bg': 'rgba(10,8,16,.9)', 'osd-ink': '#f3efff', guide: '#ffd166' },
  dark: { bg: '#101114', surface: '#1d1f24', 'surface-hi': '#2b2e34', ink: '#eef0f4', 'ink-dim': '#b6bac3', rule: '#5c6069', ring: '#f8fafc', 'ring-inner': '#101114', accent: '#7fb2ff', 'osd-bg': 'rgba(24,26,30,.92)', 'osd-ink': '#eef0f4', guide: '#f2c14e' },
  light: { bg: '#eceef2', surface: '#ffffff', 'surface-hi': '#f4f5f8', ink: '#1d2026', 'ink-dim': '#4a4f59', rule: '#b3b7c0', ring: '#1d2026', 'ring-inner': '#ffffff', accent: '#2f6fe0', 'osd-bg': 'rgba(255,255,255,.95)', 'osd-ink': '#1d2026', guide: '#b04a00' },
};
/* Tile accents (from the Bobo home's emerald / violet / amber, plus the kit's cyan and
   pink). Decoration only: an accent never carries status. */
const ACCENT_CSS = { emerald: '#10b981', violet: '#8b5cf6', amber: '#f59e0b', cyan: '#22d3ee', pink: '#ff3fb4' };
/* Sizes, the same in every theme. Container units (cqw) scale with the shell, so the
   screen reads the same at any size: the reference is a 1920-wide frame, where body
   text is 28px, readable from 3 m. The clamps keep text legible in a narrow frame. */
export const SIZES = {
  'safe-x': 'clamp(16px,5cqw,192px)',             // title-safe: 5% of the width (96px at 1920)
  'safe-y': 'clamp(12px,2.8125cqw,108px)',        // 5% of a 16:9 height (54px at 1920)
  overscan: '0px',                                // extra inset for a panel that crops its edges
  'text-caption': 'clamp(12px,1.146cqw,44px)',    // 22px at 1920
  'text-body': 'clamp(14px,1.458cqw,56px)',       // 28px
  'text-title': 'clamp(17px,1.875cqw,72px)',      // 36px
  'text-display': 'clamp(24px,2.917cqw,112px)',   // 56px
  'ring-width': 'clamp(3px,.3125cqw,12px)',       // 6px
  'ring-offset': 'clamp(2px,.156cqw,6px)',        // 3px gap between tile and ring
  'focus-scale': '1.06',
  'focus-lift': 'clamp(2px,.3125cqw,12px)',       // 6px
  'tile-w': 'clamp(128px,14.5cqw,560px)',         // 278px
  'tile-gap': 'clamp(10px,1.25cqw,48px)',         // 24px
  'row-gap': 'clamp(12px,1.667cqw,64px)',         // 32px
  radius: 'clamp(8px,.833cqw,32px)',              // 16px
  'radius-lg': 'clamp(14px,1.25cqw,48px)',        // 24px
  pad: 'clamp(6px,.625cqw,24px)',                 // 12px
  'sidebar-w': 'clamp(150px,14cqw,540px)',
  'target-h': 'clamp(40px,2.917cqw,112px)',       // 56px: a sidebar item
  duration: '250ms',
};
const B = COLOURS.boosty;
const T = (n) => `var(--tk-tv-${n},var(--_tv-${n},${B[n]}))`;
const S = (n) => `var(--tk-tv-${n},${SIZES[n]})`;
const THEME_RULES = THEMES.map((t) => `:host([theme="${t}"]){${Object.entries(COLOURS[t]).map(([k, v]) => `--_tv-${k}:${v}`).join(';')}}`).join('\n');
const SANS = 'var(--tk-font-sans,system-ui,sans-serif)';
/* Motion: one inherited switch. Reduced motion, `calm` and the kit's motion pause set it
   to 0 on an element, and everything inside it stops moving with it. */
const DUR = `calc(${S('duration')} * var(--_tv-motion,1))`;
const MOTION_RULES = `
@media (prefers-reduced-motion:reduce){:host{--_tv-motion:0}}
:host([calm]),:host([data-motion-paused]){--_tv-motion:0}`;
const RING = `0 0 0 ${S('ring-offset')} ${T('ring-inner')},0 0 0 calc(${S('ring-offset')} + ${S('ring-width')}) ${T('ring')}`;
const BASE = `${THEME_RULES}${MOTION_RULES}
:host([hidden]){display:none}
*,*::before,*::after{box-sizing:border-box}`;

const sheet = (css) => { try { const s = new CSSStyleSheet(); s.replaceSync(css); return s; } catch { return null; } };
const sheets = new Map();
const attach = (el, name, css, opts = {}) => {
  const root = el.attachShadow({ mode: 'open', ...opts });
  if (!sheets.has(name)) sheets.set(name, sheet(css));
  const s = sheets.get(name);
  if (s && 'adoptedStyleSheets' in root) root.adoptedStyleSheets = [s]; else { const st = document.createElement('style'); st.textContent = css; root.appendChild(st); }
  return root;
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const list = (v) => String(v ?? '').split(/[\s,]+/).filter(Boolean);
let UID = 0;
const HTMLBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

/* The kit's motion pause (html[data-motion="paused"], the PauseMotion button): one
   observer for every element, as in the gamepad and keyboard packs. */
const MOTION_WATCHED = new Set(); let MOTION_OBS = null;
const motionPaused = () => typeof document !== 'undefined' && document.documentElement?.getAttribute('data-motion') === 'paused';
function watchMotion(el) {
  MOTION_WATCHED.add(el); el.toggleAttribute?.('data-motion-paused', motionPaused());
  if (!MOTION_OBS && typeof MutationObserver === 'function' && typeof document !== 'undefined') {
    MOTION_OBS = new MutationObserver(() => { const p = motionPaused(); for (const e of MOTION_WATCHED) e.toggleAttribute('data-motion-paused', p); });
    MOTION_OBS.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  }
}
const unwatchMotion = (el) => MOTION_WATCHED.delete(el);
/* Does this element move? Reads the inherited switch, so a calm shell calms its rows. */
const moves = (el) => { try { return getComputedStyle(el).getPropertyValue('--_tv-motion').trim() !== '0'; } catch { return false; } };

/* ---------------------------------------------------------------- <tk-tv-shell> */
const SHELL_CSS = `${BASE}
:host{display:block;position:relative;container-type:inline-size;background:${T('bg')};color:${T('ink')};font:400 ${S('text-body')}/1.35 ${SANS};-webkit-tap-highlight-color:transparent}
.frame{position:relative;min-height:100%;isolation:isolate}
:host([screen]) .frame{aspect-ratio:16/9;overflow:hidden;display:flex;flex-direction:column}
@container (inline-size < 600px){:host([screen]) .frame{aspect-ratio:auto;overflow:visible}}
.safe{display:flex;align-items:flex-start;gap:${S('row-gap')};padding:calc(${S('safe-y')} + ${S('overscan')}) calc(${S('safe-x')} + ${S('overscan')});min-height:inherit}
:host([screen]) .safe{flex:1;min-height:0}
.main{flex:1;min-width:0;display:flex;flex-direction:column;gap:${S('row-gap')}}
:host([screen]) .main{max-height:100%;overflow-y:auto;scrollbar-width:none;align-self:stretch}
.overlay{position:absolute;inset:auto calc(${S('safe-x')} + ${S('overscan')}) calc(${S('safe-y')} + ${S('overscan')});display:flex;justify-content:center;pointer-events:none;z-index:3}
.overlay ::slotted(*){pointer-events:auto}
.guides{position:absolute;inset:0;pointer-events:none;z-index:4}
.guides[hidden]{display:none}
.g{position:absolute;border:2px dashed ${T('guide')}}
.g span{position:absolute;inset-block-start:2px;inset-inline-end:4px;padding:1px 6px;background:${T('bg')};color:${T('guide')};font:600 ${S('text-caption')}/1.2 ${SANS}}
.g.action{inset:3.5%}
.g.title{inset:5%;border-style:dotted}
.g.title span{inset-block-start:auto;inset-block-end:2px;inset-inline-end:auto;inset-inline-start:4px}
.g.safe-box{inset:calc(${S('safe-y')} + ${S('overscan')}) calc(${S('safe-x')} + ${S('overscan')});border-style:solid;border-width:1px;opacity:.75}
.g.safe-box span{inset-block-start:auto;inset-block-end:2px}
@media (forced-colors:active){.g{border-color:CanvasText}.g span{color:CanvasText;background:Canvas}}`;
/* What spatial focus can land on inside a shell. */
export const FOCUSABLE = 'tk-tv-tile, a[href], button, [data-tv-focus], [tabindex]:not([tabindex="-1"])';
const isCurrent = (el) => { const c = el.getAttribute('aria-current') ?? el.getAttribute('current'); return c != null && c !== 'false'; };

export class TkTvShell extends HTMLBase {
  static get observedAttributes() { return ['theme', 'guides', 'input', 'capture', 'label', 'screen']; }
  constructor() {
    super(); this._root = attach(this, 'shell', SHELL_CSS);
    this._root.innerHTML = `<div class="frame" part="frame" role="region"><div class="safe" part="safe"><slot name="menu"></slot><div class="main" part="main"><slot></slot></div></div><div class="overlay" part="overlay"><slot name="overlay"></slot></div><div class="guides" aria-hidden="true" hidden><div class="g action"><span>Action safe 93%</span></div><div class="g title"><span>Title safe 90%</span></div><div class="g safe-box"><span>Safe area</span></div></div></div>`;
    this._frame = this._root.querySelector('.frame'); this._guides = this._root.querySelector('.guides');
    this.nav = createFocusNav({ items: () => this.items(), current: () => this.currentItem(), focus: (it) => this._focus(it) });
    this._onFocusIn = () => { const it = this.currentItem(); if (it) this.nav.remember(it); };
  }
  connectedCallback() { watchMotion(this); this._apply(); this._wire(); this.addEventListener('focusin', this._onFocusIn); }
  disconnectedCallback() { unwatchMotion(this); this._remote?.stop(); this._remote = null; this.removeEventListener('focusin', this._onFocusIn); }
  attributeChangedCallback(n, o, v) { if (o === v || !this.isConnected) return; if (n === 'input' || n === 'capture') this._wire(); else this._apply(); }
  _apply() { this._guides.hidden = !this.hasAttribute('guides'); this._frame.setAttribute('aria-label', this.getAttribute('label') || 'TV'); }
  /* The level an element belongs to: its own data-tv-level, the sidebar's 'menu', else 'main'. */
  levelOf(el) { const l = el.closest('[data-tv-level]'); return l && this.contains(l) ? l.getAttribute('data-tv-level') : el.closest('tk-tv-sidebar') ? 'menu' : 'main'; }
  /* Everything spatial focus can land on now, in reading order, with its box. */
  items() {
    const out = [];
    for (const el of this.querySelectorAll(FOCUSABLE)) {
      if (el.closest('tk-tv-tile') !== el && el.closest('tk-tv-tile')) continue;
      if (el.hasAttribute('disabled') || el.closest('[inert],[hidden]')) continue;
      const b = el.getBoundingClientRect(); if (b.width < 1 || b.height < 1) continue;
      out.push({ key: el, el, rect: rectOf(b), row: el.closest('tk-tv-row'), level: this.levelOf(el), current: isCurrent(el) });
    }
    return out;
  }
  currentItem() {
    let a = this.getRootNode()?.activeElement ?? document.activeElement;
    if (!a || !this.contains(a)) return null;
    const host = a.closest(FOCUSABLE); if (!host) return null;
    const b = host.getBoundingClientRect();
    return { key: host, el: host, rect: rectOf(b), row: host.closest('tk-tv-row'), level: this.levelOf(host), current: isCurrent(host) };
  }
  _focus(it) { it.el.focus({ preventScroll: true }); it.el.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: moves(this) ? 'smooth' : 'auto' }); }
  /* The remote: keys on the shell itself (so only while focus is inside it), and the
     gamepad hub when input includes "pad". Verbs act only while focus is in the shell
     or on nothing at all, so a pad never moves focus out from under another part of the page. */
  _wire() {
    this._remote?.stop();
    if (typeof window === 'undefined') return;
    const want = new Set(list(this.getAttribute('input') ?? 'keys'));
    const root = this.getRootNode?.() ?? document;
    const accept = () => { const a = root.activeElement ?? document.activeElement; return !a || a === document.body || this.contains(a); };
    this._remote = createRemote({ target: this, keys: want.has('keys'), pad: want.has('pad') ? sharedHub() : null, capture: this.hasAttribute('capture'), accept });
    this._remote.on((d) => { if (!d.defaultPrevented) this.act(d.verb, d.dir); });
    this._remote.start();
  }
  /* A verb from anywhere (an on-screen D-pad, the phone remote): the same as the remote's. */
  press(verb, dir) { return this._remote ? this._remote.press(verb, dir) : (this.act(verb, dir), null); }
  /* The default for each verb. */
  act(verb, dir) {
    const cur = this.currentItem();
    switch (verb) {
      case 'move': return this.nav.move(dir);
      case 'select': { if (!cur) return this.nav.move('down'); const el = cur.el; if (typeof el.activate === 'function') el.activate(); else el.click(); return cur; }
      case 'back': { const to = this.nav.back(); if (!to) this.dispatchEvent(new CustomEvent('tk-tv-exit', { bubbles: true, composed: true })); return to; }
      case 'home': return this.nav.home();
      case 'menu': return cur && cur.level === 'menu' ? this.nav.back() : this.nav.enter('menu');
      default: return null;
    }
  }
}

/* ---------------------------------------------------------------- <tk-tv-row> */
const PAD_BLOCK = `calc(${S('ring-offset')} + ${S('ring-width')} + ${S('focus-lift')} + ${S('tile-w')} * .04)`;
const PAD_INLINE = `calc(${S('ring-offset')} + ${S('ring-width')} + ${S('tile-w')} * .035)`;
const ROW_CSS = `${BASE}
:host{display:block;min-width:0;color:${T('ink')}}
section{min-width:0}
.title{margin:0;padding-inline:${PAD_INLINE};font:700 ${S('text-title')}/1.2 ${SANS};letter-spacing:0;color:${T('ink')}}
.title:empty{display:none}
.track{display:flex;gap:${S('tile-gap')};overflow-x:auto;overflow-y:hidden;padding:${PAD_BLOCK} ${PAD_INLINE};scroll-padding-inline:${PAD_INLINE};scrollbar-width:thin;scrollbar-color:${T('rule')} transparent;overscroll-behavior-x:contain}
:host([layout="grid"]) .track{flex-wrap:wrap;overflow:visible}
.track ::slotted(*){flex:none}`;
export class TkTvRow extends HTMLBase {
  static get observedAttributes() { return ['label', 'layout', 'level', 'theme']; }
  constructor() { super(); this._root = attach(this, 'row', ROW_CSS); this._uid = 'tktvr' + (++UID); this._onFocusIn = (e) => this._reveal(e.target); }
  connectedCallback() { watchMotion(this); this._render(); this.addEventListener('focusin', this._onFocusIn); }
  disconnectedCallback() { unwatchMotion(this); this.removeEventListener('focusin', this._onFocusIn); }
  attributeChangedCallback(n, o, v) { if (o !== v && this.isConnected && n !== 'theme') this._render(); }
  _render() {
    const lv = Math.min(6, Math.max(2, parseInt(this.getAttribute('level') || '2', 10) || 2)), label = this.getAttribute('label') || '';
    this._root.innerHTML = `<section part="row"${label ? ` aria-labelledby="${this._uid}"` : ''}><h${lv} class="title" part="title" id="${this._uid}">${esc(label)}</h${lv}><div class="track" part="track"><slot></slot></div></section>`;
    this._track = this._root.querySelector('.track');
  }
  /* Keep the focused tile, and its ring, inside the row's view. */
  _reveal(el) {
    const t = this._track; if (!t || !el || el === this || this.getAttribute('layout') === 'grid') return;
    const tb = t.getBoundingClientRect(), eb = el.getBoundingClientRect(), pad = parseFloat(getComputedStyle(t).scrollPaddingInlineStart) || 0;
    let dx = 0;
    if (eb.left < tb.left + pad) dx = eb.left - tb.left - pad; else if (eb.right > tb.right - pad) dx = eb.right - tb.right + pad;
    if (dx) t.scrollBy({ left: dx, behavior: moves(this) ? 'smooth' : 'auto' });
  }
}

/* ---------------------------------------------------------------- <tk-tv-tile> */
const TILE_CSS = `${BASE}
:host{display:inline-block;vertical-align:top;width:${S('tile-w')};max-width:100%;border-radius:${S('radius')};--_acc:var(--tk-tv-tile-accent,${T('accent')})}
/* The ring is the inner tile's shadow; this outline is what forced colours keep. It is
   !important because the page's own focus rules (outline: none when focus isn't
   keyboard-visible) would otherwise win over a shadow root's :host. */
:host(:focus),:host([focused]){outline:${S('ring-width')} solid transparent !important;outline-offset:${S('ring-offset')} !important}
${ACCENTS.map((a) => `:host([accent="${a}"]){--_acc:var(--tk-tv-tile-accent,var(--tk-tv-accent-${a},${ACCENT_CSS[a]}))}`).join('\n')}
.tile{all:unset;box-sizing:border-box;position:relative;display:flex;flex-direction:column;width:100%;border-radius:${S('radius')};background:${T('surface')};color:${T('ink')};border:1px solid ${T('rule')};cursor:pointer;overflow:hidden;outline:none;transition:transform ${DUR} ease,box-shadow ${DUR} ease,background-color ${DUR} ease}
.art{position:relative;display:block;aspect-ratio:16/9;background:linear-gradient(140deg,color-mix(in srgb,var(--_acc) 55%,${T('surface')}),${T('surface-hi')} 75%);overflow:hidden}
.art img{display:block;width:100%;height:100%;object-fit:cover}
.art::after{content:"";position:absolute;inset:auto 0 0 0;height:max(3px,6%);background:var(--_acc)}
:host([accent="none"]) .art::after{display:none}
.text{display:flex;flex-direction:column;gap:2px;padding:${S('pad')}}
.label{font:700 ${S('text-body')}/1.2 ${SANS};letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sub{font:500 ${S('text-caption')}/1.3 ${SANS};color:${T('ink-dim')};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sub:empty,.badge:empty{display:none}
.badge{position:absolute;inset-block-start:${S('pad')};inset-inline-start:${S('pad')};z-index:1;padding:2px 10px;border-radius:999px;background:${T('osd-bg')};color:${T('osd-ink')};border:1px solid ${T('rule')};font:700 ${S('text-caption')}/1.3 ${SANS}}
.tile:hover{background:${T('surface-hi')}}
.tile:focus,:host([focused]) .tile{z-index:2;background:${T('surface-hi')};box-shadow:${RING};transform:translateY(calc(-1 * ${S('focus-lift')})) scale(${S('focus-scale')})}
.tile:focus .label,:host([focused]) .label{text-decoration:underline;text-decoration-thickness:max(2px,.08em);text-underline-offset:.18em}
.tile[aria-disabled="true"]{cursor:default;opacity:.55}
@media (forced-colors:active){.tile{border-color:CanvasText}:host(:focus),:host([focused]){outline-color:Highlight !important}.tile:focus,:host([focused]) .tile{transform:none}.art::after{background:CanvasText}.badge{border-color:CanvasText}}`;
export class TkTvTile extends HTMLBase {
  static get observedAttributes() { return ['label', 'sub', 'image', 'alt', 'accent', 'badge', 'href', 'disabled', 'theme', 'current', 'focused']; }
  constructor() { super(); this._root = attach(this, 'tile', TILE_CSS, { delegatesFocus: true }); this._uid = 'tktvt' + (++UID); this._onClick = (e) => this._select(e); }
  connectedCallback() { watchMotion(this); this._render(); }
  disconnectedCallback() { unwatchMotion(this); }
  attributeChangedCallback(n, o, v) { if (o !== v && this.isConnected && n !== 'theme' && n !== 'focused') this._render(); }
  /* Select, as the remote's select verb does: the same as a click. */
  activate() { this._btn?.click(); }
  _select(e) {
    if (this.hasAttribute('disabled')) { e.preventDefault(); return; }
    this.dispatchEvent(new CustomEvent('tk-tv-select', { detail: { label: this.getAttribute('label') || '', href: this.getAttribute('href') || null }, bubbles: true, composed: true }));
  }
  _render() {
    const label = this.getAttribute('label') || 'Untitled', sub = this.getAttribute('sub') || '', badge = this.getAttribute('badge') || '', img = this.getAttribute('image'), href = this.getAttribute('href'), off = this.hasAttribute('disabled'), u = this._uid;
    const cur = this.getAttribute('current');
    const desc = [sub && `${u}-s`, badge && `${u}-b`].filter(Boolean).join(' ');
    const tag = href && !off ? 'a' : 'button';
    const attrs = tag === 'a' ? `href="${esc(href)}"` : `type="button"${off ? ' aria-disabled="true"' : ''}`;
    this._root.innerHTML = `<${tag} class="tile" part="tile" ${attrs} aria-labelledby="${u}-l"${desc ? ` aria-describedby="${desc}"` : ''}${cur ? ` aria-current="${esc(cur === '' ? 'true' : cur)}"` : ''}>`
      + `<span class="art" part="art">${img ? `<img src="${esc(img)}" alt="${esc(this.getAttribute('alt') || '')}" loading="lazy" decoding="async">` : ''}<span class="badge" id="${u}-b">${esc(badge)}</span></span>`
      + `<span class="text"><span class="label" id="${u}-l">${esc(label)}</span><span class="sub" id="${u}-s">${esc(sub)}</span></span></${tag}>`;
    this._btn = this._root.querySelector('.tile'); this._btn.addEventListener('click', this._onClick);
  }
}

/* ---------------------------------------------------------------- <tk-tv-sidebar> */
const SIDEBAR_CSS = `${BASE}
:host{display:block;flex:none;color:${T('ink')};--_pad:${S('pad')};--_r:${S('radius-lg')}}
nav{display:flex;flex-direction:column;gap:4px;width:${S('sidebar-w')};padding:var(--_pad);border-radius:var(--_r);background:${T('surface')};border:1px solid ${T('rule')};transition:width ${DUR} ease}
:host([collapse]) nav{width:calc(var(--_pad) * 4 + 1.4em + 2px)}
:host([collapse]:focus-within) nav{width:${S('sidebar-w')}}
::slotted(a),::slotted(button){all:unset;box-sizing:border-box;border:1px solid transparent;display:flex;align-items:center;gap:var(--_pad);min-height:${S('target-h')};padding:0 var(--_pad);border-radius:calc(var(--_r) - var(--_pad));color:${T('ink-dim')};font:600 ${S('text-body')}/1.2 ${SANS};white-space:nowrap;overflow:hidden;cursor:pointer;outline:${S('ring-width')} solid transparent;outline-offset:${S('ring-offset')};transition:background-color ${DUR} ease,box-shadow ${DUR} ease,transform ${DUR} ease}
::slotted(a:hover),::slotted(button:hover){background:${T('surface-hi')};color:${T('ink')}}
::slotted([aria-current]){color:${T('ink')};font-weight:800;box-shadow:inset 4px 0 0 ${T('accent')}}
::slotted(a:focus),::slotted(button:focus){color:${T('ink')};background:${T('surface-hi')};box-shadow:${RING};transform:scale(1.04);outline:${S('ring-width')} solid transparent !important;outline-offset:${S('ring-offset')} !important}
@media (forced-colors:active){nav{border-color:CanvasText}::slotted(a:focus),::slotted(button:focus){outline-color:Highlight !important}::slotted([aria-current]){text-decoration:underline}}`;
export class TkTvSidebar extends HTMLBase {
  static get observedAttributes() { return ['label', 'collapse', 'theme']; }
  constructor() { super(); this._root = attach(this, 'sidebar', SIDEBAR_CSS); this._root.innerHTML = `<nav part="nav"><slot></slot></nav>`; this._nav = this._root.querySelector('nav'); }
  connectedCallback() {
    watchMotion(this);
    if (!this.hasAttribute('slot') && this.parentElement?.localName === 'tk-tv-shell') this.setAttribute('slot', 'menu');
    this._apply();
  }
  disconnectedCallback() { unwatchMotion(this); }
  attributeChangedCallback(n, o, v) { if (o !== v && this.isConnected) this._apply(); }
  _apply() { this._nav.setAttribute('aria-label', this.getAttribute('label') || 'Menu'); }
}

/* ---------------------------------------------------------------- <tk-tv-osd> */
const ICONS = {
  volume: '<path d="M3 9h4l5-4v14l-5-4H3z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/>',
  muted: '<path d="M3 9h4l5-4v14l-5-4H3z"/><path class="w" d="M16 9l5 6M21 9l-5 6"/>',
  'now-playing': '<path d="M7 5l12 7-12 7z"/>',
  paused: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
  message: '<circle class="w" cx="12" cy="12" r="9"/><path d="M11 10.5h2V17h-2zM11 7h2v2h-2z"/>',
};
const OSD_CSS = `${BASE}
:host{display:block;width:min(100%,calc(${S('tile-w')} * 2.4));margin-inline:auto;color:${T('osd-ink')};font:600 ${S('text-body')}/1.25 ${SANS}}
.osd{display:flex;align-items:center;gap:${S('pad')};width:100%;padding:${S('pad')} calc(${S('pad')} * 2);border-radius:999px;background:${T('osd-bg')};border:1px solid ${T('rule')};box-shadow:0 12px 32px rgba(0,0,0,.35);opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity ${DUR} ease,transform ${DUR} ease,visibility 0s linear ${DUR}}
:host([open]) .osd{opacity:1;visibility:visible;transform:none;transition:opacity ${DUR} ease,transform ${DUR} ease,visibility 0s}
svg{flex:none;width:1.4em;height:1.4em;fill:currentColor}
svg .w{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.text{display:flex;flex-direction:column;min-width:0;flex:1}
.name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.detail{font:500 ${S('text-caption')}/1.3 ${SANS};color:${T('ink-dim')};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.detail:empty{display:none}
.bar{flex:1.4;min-width:3em;height:max(6px,.35em);border-radius:999px;background:color-mix(in srgb,${T('osd-ink')} 22%,transparent);overflow:hidden}
.bar[hidden]{display:none}
.fill{display:block;height:100%;width:var(--_v,0%);background:${T('osd-ink')};border-radius:inherit}
:host([muted]) .fill{width:0}
.value{min-width:2.4em;text-align:end;font-variant-numeric:tabular-nums;white-space:nowrap}
.sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@media (forced-colors:active){.osd{border-color:CanvasText}.bar{border:1px solid CanvasText}.fill{background:CanvasText}}`;
const clampPct = (v) => Math.max(0, Math.min(100, Math.round(+v || 0)));
/* What the OSD says, in words: the live region's line and the tests' contract. */
export function osdSummary({ kind = 'volume', value = null, muted = false, label = '', detail = '', paused = false } = {}) {
  if (kind === 'volume') return muted ? `Volume ${clampPct(value)}, muted` : `Volume ${clampPct(value)}`;
  if (kind === 'now-playing') return `${paused ? 'Paused' : 'Now playing'}${label ? `: ${label}` : ''}${detail ? `, ${detail}` : ''}`;
  return label || detail || '';
}
export class TkTvOsd extends HTMLBase {
  static get observedAttributes() { return ['kind', 'value', 'muted', 'label', 'detail', 'paused', 'open', 'persist', 'timeout', 'theme']; }
  constructor() { super(); this._root = attach(this, 'osd', OSD_CSS); this._root.innerHTML = `<div class="osd" part="osd" aria-hidden="true"></div><span class="sr" role="status"></span>`; this._box = this._root.firstElementChild; this._sr = this._root.querySelector('.sr'); this._timer = null; }
  connectedCallback() { watchMotion(this); this._render(); this._arm(); }
  disconnectedCallback() { unwatchMotion(this); clearTimeout(this._timer); }
  attributeChangedCallback(n, o, v) {
    if (o === v || !this.isConnected) return;
    if (n === 'theme') return;
    if (n === 'open' || n === 'persist' || n === 'timeout') { this._arm(); if (n === 'open' && v != null) this._announce(); return; }
    this._render(); if (this.hasAttribute('open')) this._announce();
  }
  /* Show it (with new values, if given) and let it fade after `timeout` ms. */
  show(o = {}) {
    for (const k of ['kind', 'value', 'label', 'detail']) if (o[k] != null) this.setAttribute(k, String(o[k]));
    for (const k of ['muted', 'paused']) if (o[k] != null) this.toggleAttribute(k, !!o[k]);
    if (this.hasAttribute('open')) { this._arm(); this._announce(); } else this.setAttribute('open', '');
  }
  hide() { this.removeAttribute('open'); }
  get summary() { return osdSummary(this._state()); }
  _state() { return { kind: OSD_KINDS.includes(this.getAttribute('kind')) ? this.getAttribute('kind') : 'volume', value: this.getAttribute('value'), muted: this.hasAttribute('muted'), label: this.getAttribute('label') || '', detail: this.getAttribute('detail') || '', paused: this.hasAttribute('paused') }; }
  _arm() {
    clearTimeout(this._timer); this._timer = null;
    if (!this.hasAttribute('open') || this.hasAttribute('persist')) return;
    const ms = Math.max(1000, +(this.getAttribute('timeout') || 3000) || 3000);
    this._timer = setTimeout(() => this.removeAttribute('open'), ms);
  }
  _announce() { this._sr.textContent = ''; const s = this.summary; queueMicrotask(() => { this._sr.textContent = s; }); }
  _render() {
    const s = this._state(), hasValue = s.value != null && s.value !== '';
    const icon = s.kind === 'volume' ? (s.muted ? 'muted' : 'volume') : s.kind === 'now-playing' ? (s.paused ? 'paused' : 'now-playing') : 'message';
    const name = s.kind === 'volume' ? 'Volume' : s.kind === 'now-playing' ? (s.label || 'Now playing') : (s.label || '');
    const detail = s.kind === 'volume' ? '' : s.kind === 'now-playing' ? [s.paused ? 'Paused' : '', s.detail].filter(Boolean).join(' · ') : s.detail;
    const value = s.kind === 'volume' ? (s.muted ? 'Muted' : String(clampPct(s.value))) : '';
    const bar = s.kind === 'volume' || (s.kind === 'now-playing' && hasValue);
    this._box.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[icon]}</svg><span class="text"><span class="name">${esc(name)}</span><span class="detail">${esc(detail)}</span></span><span class="bar"${bar ? '' : ' hidden'}><span class="fill"></span></span>${value ? `<span class="value">${esc(value)}</span>` : ''}`;
    this._box.style.setProperty('--_v', clampPct(s.value) + '%');
  }
}

export function defineTvElements(reg = globalThis.customElements) {
  if (!reg) return false;
  if (!reg.get('tk-tv-shell')) reg.define('tk-tv-shell', TkTvShell);
  if (!reg.get('tk-tv-row')) reg.define('tk-tv-row', TkTvRow);
  if (!reg.get('tk-tv-tile')) reg.define('tk-tv-tile', TkTvTile);
  if (!reg.get('tk-tv-sidebar')) reg.define('tk-tv-sidebar', TkTvSidebar);
  if (!reg.get('tk-tv-osd')) reg.define('tk-tv-osd', TkTvOsd);
  return true;
}
defineTvElements();
export { createRemote, verbForKey, verbForButton, stickDirection, createPadReader, VERBS, DIRECTIONS, KEY_VERBS, PAD_VERBS, REMOTE_KEY_NAMES, VERB_WORDS };
export { createFocusNav, pickNext, isAhead, rectOf };
