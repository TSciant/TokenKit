/* TokenKit keyboard pack: <tk-keyboard> and <tk-key-prompt>.
   Framework-agnostic custom elements. Import once; they define themselves (and do
   nothing on a server, where customElements is missing).

     <tk-keyboard keys="wasd arrows space shift" theme="boosty" highlight="KeyW" pulse></tk-keyboard>
     <tk-keyboard source="live"></tk-keyboard>
     <tk-key-prompt key="KeyW" action="Move forward"></tk-key-prompt>
     el.state = { pressed: ['KeyW', 'ShiftLeft'] }   // codes, by position

   Tokens: every colour is a --tk-keyboard-* custom property (they pierce the shadow
   root), and theme="boosty|dark|light" only sets their defaults. */
import { keyboardSVG, keyboardLayout, UNIT } from './keyboard-art.mjs';
import { MAIN, ARROWS, CLUSTERS, DEFAULT_KEYS, KNOWN_CODES, parseKeys, toView, usLabel, capLabel, keyWord, printable, isEditableTarget, createKeyboardHub, layoutLabels } from './keyboard-core.mjs';
import { createKeyReplay, syncKeysToMedia, KEY_STATES } from './keyboard-replay.mjs';

export const THEMES = ['boosty', 'dark', 'light'];
/* theme defaults. A page overrides any of them with its own --tk-keyboard-* values. */
const THEME_CSS = {
  boosty: `--_deck-hi:#2a2533;--_deck-lo:#07060a;--_rim:#3a3448;--_cap:#0d0b12;--_face-hi:#34303f;--_face-lo:#1f1b27;--_ink:#ece8f6;--_down:#ff3fb4;--_down-ink:#14040e;--_down-edge:#ffc2e6;--_accent:#22e4f0;--_label:#efe9ff;--_chip-bg:rgba(10,8,16,.82);--_chip-ink:#f3efff;--_chip-key:#22e4f0;--_chip-cap:#2c2836;--_chip-cap-ink:#f3efff;--_chip-lit-ink:#07060a`,
  dark: `--_deck-hi:#4a4d55;--_deck-lo:#17181c;--_rim:#5c6069;--_cap:#121316;--_face-hi:#44474f;--_face-lo:#2b2e34;--_ink:#eef0f4;--_down:#f2c14e;--_down-ink:#201600;--_down-edge:#fff1c9;--_accent:#7fb2ff;--_label:#eef0f4;--_chip-bg:rgba(24,26,30,.9);--_chip-ink:#eef0f4;--_chip-key:#7fb2ff;--_chip-cap:#3c3f46;--_chip-cap-ink:#eef0f4;--_chip-lit-ink:#0e1420`,
  light: `--_deck-hi:#ffffff;--_deck-lo:#d5d8de;--_rim:#b3b7c0;--_cap:#9fa4ad;--_face-hi:#ffffff;--_face-lo:#e6e8ec;--_ink:#2a2d33;--_down:#2f6fe0;--_down-ink:#ffffff;--_down-edge:#0f2f73;--_accent:#2f6fe0;--_label:#1d2026;--_chip-bg:rgba(255,255,255,.94);--_chip-ink:#1d2026;--_chip-key:#2f6fe0;--_chip-cap:#f4f5f7;--_chip-cap-ink:#1d2026;--_chip-lit-ink:#ffffff`,
};
const T = (n) => `var(--tk-keyboard-${n},var(--_${n}))`;
const THEME_RULES = THEMES.map((t) => `:host([theme="${t}"]){${THEME_CSS[t]}}`).join('\n');
const SANS = 'var(--tk-font-sans,system-ui,sans-serif)';
const BASE_CSS = `
:host{${THEME_CSS.boosty};display:inline-block;position:relative;line-height:1;vertical-align:middle;max-width:100%;-webkit-tap-highlight-color:transparent}
${THEME_RULES}
:host([hidden]){display:none}
svg{display:block;overflow:visible;max-width:100%;height:auto}
.d-hi{stop-color:${T('deck-hi')}}.d-lo{stop-color:${T('deck-lo')}}
.f-hi{stop-color:${T('face-hi')}}.f-lo{stop-color:${T('face-lo')}}
.drop{fill:#000;opacity:.28}
.rim{fill:none;stroke:${T('rim')};stroke-width:1.2;opacity:.9}
.skirt{fill:${T('cap')};stroke:${T('rim')};stroke-width:1}
.lg{fill:${T('ink')};font:700 14px/1 ${SANS};letter-spacing:0}
.lg.wd{font-size:10.5px;font-weight:650;letter-spacing:.02em}
.top{transition:transform .08s ease-out}
.k.on .face{fill:${T('down')}}
.k.on .lg{fill:${T('down-ink')}}
.k.on .skirt{stroke:${T('down-edge')};stroke-width:2.2}
.k.on .top{transform:translateY(2px)}
.hl{fill:none;stroke:${T('accent')};stroke-width:2.4;opacity:0;transition:opacity .25s ease}
.k.lit .hl{opacity:1}
:host([pulse]) .k.lit .hl{animation:tkkb-breathe 1.6s ease-in-out infinite}
@keyframes tkkb-breathe{0%,100%{opacity:1}50%{opacity:.45}}
@media (prefers-reduced-motion:reduce){.hl,.top{transition:none}:host([pulse]) .k.lit .hl{animation:none}}
:host([calm]) .hl,:host([calm]) .top{transition:none}:host([calm][pulse]) .k.lit .hl{animation:none}
:host([data-motion-paused][pulse]) .k.lit .hl{animation:none}
@media (forced-colors:active){.deck{fill:Canvas}.rim,.skirt{stroke:CanvasText}.face{fill:Canvas}.lg{fill:CanvasText}.k.on .face{fill:Highlight}.k.on .lg{fill:HighlightText}.k.on .skirt{stroke:Highlight;stroke-width:3}.hl{stroke:LinkText}}
.status[hidden]{display:none}
.status{font:600 11px/1.3 ${SANS};color:${T('label')};margin-top:6px;text-align:center}
`;
const sheet = (css) => { try { const s = new CSSStyleSheet(); s.replaceSync(css); return s; } catch { return null; } };
const attach = (el, css, cache) => {
  const root = el.attachShadow({ mode: 'open' }); const s = cache();
  if (s && 'adoptedStyleSheets' in root) root.adoptedStyleSheets = [s]; else { const st = document.createElement('style'); st.textContent = css; root.appendChild(st); }
  return root;
};
let KB_SHEET = null; const kbSheet = () => (KB_SHEET ||= sheet(BASE_CSS));
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(/[\s,]+/)).filter(Boolean);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let UID = 0;
const HTMLBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;
/* The kit's motion pause (html[data-motion="paused"], the PauseMotion button) stops the
   highlight's breathing, as reduced motion does: one observer for every element. */
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
/* The layout's letters, once per page, for every element that wants them. */
function withLayout(el, then) {
  if (el._ownLabels) { el._labels = el._ownLabels; return; }
  if (el.getAttribute('layout') === 'us') { el._labels = null; return; }
  layoutLabels().then((m) => { if (m && el.isConnected && !el._ownLabels && el.getAttribute('layout') !== 'us') { el._labels = m; then(); } });
}
/* A host's own letters (a game's key settings, a test): code -> character. They win over
   the browser's layout map; null goes back to it. */
function setOwnLabels(el, m) { el._ownLabels = m && typeof m === 'object' ? m : null; el._labels = el._ownLabels; if (el.isConnected) { el._render(); if (!el._ownLabels) withLayout(el, () => el._render()); } }

/* Words for the default accessible name: "Keyboard: W A S D (with Q and E), arrow keys". */
const CLUSTER_WORDS = { wasd: 'W A S D (with Q and E)', arrows: 'arrow keys', space: 'Space bar', shift: 'Left Shift', ctrl: 'Left Ctrl', alt: 'Left Alt', tab: 'Tab', esc: 'Esc', enter: 'Enter', numbers: '1 to 4', numbers9: '1 to 9', fkeys: 'F1 to F4' };
export function describeKeys(v = DEFAULT_KEYS, labels = null) {
  return list(v).map((t) => CLUSTER_WORDS[t.toLowerCase()] ?? ((t in MAIN || t in ARROWS) ? keyWord(t, labels) : null)).filter(Boolean).join(', ');
}

export class TkKeyboard extends HTMLBase {
  static get observedAttributes() { return ['keys', 'theme', 'size', 'highlight', 'source', 'capture', 'layout', 'label', 'status']; }
  constructor() { super(); this._root = attach(this, BASE_CSS, kbSheet); this._uid = 'tkkb' + (++UID); this._view = toView(null); this._labels = null; this._unsub = null; this._offEv = null; this._hub = null; }
  connectedCallback() { watchMotion(this); this._render(); this._wireSource(); withLayout(this, () => this._render()); }
  disconnectedCallback() { unwatchMotion(this); this._unwire(); this._stopReplay?.(); this._stopReplay = null; }
  attributeChangedCallback(n, o, v) {
    if (o === v || !this.isConnected) return;
    if (n === 'source' || n === 'capture') { this._wireSource(); this._apply(); }
    else if (n === 'highlight') this._applyHighlight();
    else if (n === 'size') this._applySize();
    else if (n === 'layout') { this._labels = this._ownLabels || null; this._render(); withLayout(this, () => this._render()); }
    else this._render();
  }
  /* a hand-fed state: { pressed: ['KeyW', ...] } or an array of codes */
  set state(s) { this._view = toView(s); this._apply(); }
  get state() { return this._view; }
  /* the codes drawn, after clusters are expanded */
  get codes() { return parseKeys(this.getAttribute('keys') ?? DEFAULT_KEYS); }
  /* the codes held now (live input, replay or hand-fed) */
  get held() { return this._view.pressed.slice(); }
  /* outline one or more keys, as a HUD does for "W: Move forward" */
  highlight(codes, { pulse } = {}) { this.setAttribute('highlight', list(codes).join(' ')); if (pulse != null) this.toggleAttribute('pulse', !!pulse); }
  get geometry() { return keyboardLayout(this.codes); }
  set labels(m) { setOwnLabels(this, m); }
  get labels() { return this._labels; }
  _render() {
    const label = this.getAttribute('label') || `Keyboard: ${describeKeys(this.getAttribute('keys') ?? DEFAULT_KEYS, this._labels)}`;
    this._root.querySelectorAll('svg,.status').forEach((n) => n.remove());
    const wrap = document.createElement('div'); wrap.innerHTML = keyboardSVG({ codes: this.codes, uid: this._uid, title: label, labels: this._labels });
    this._svg = wrap.firstElementChild; this._root.appendChild(this._svg);
    // No live region: a key press is never announced. The status line says what the
    // source is, not what was pressed.
    if (this.hasAttribute('status')) { this._status = document.createElement('div'); this._status.className = 'status'; this._root.appendChild(this._status); } else this._status = null;
    this._els = {}; this._svg.querySelectorAll('[data-code]').forEach((e) => { this._els[e.dataset.code] = e; });
    this._applySize(); this._applyHighlight(); this._apply();
  }
  _applySize() {
    if (!this._svg) return; const s = this.getAttribute('size'), w = +this._svg.getAttribute('viewBox').split(' ')[2];
    const css = !s ? null : /[a-z%]$/i.test(s) ? s : (+s > 0 ? Math.round(+s * w) + 'px' : null);
    this._svg.style.width = css || `calc(${w}px * var(--tk-keyboard-scale, 1))`;
  }
  _applyHighlight() {
    if (!this._svg) return; const hl = new Set(list(this.getAttribute('highlight')).flatMap((t) => CLUSTERS[t.toLowerCase()] ?? [t]));
    for (const c in this._els) this._els[c].classList.toggle('lit', hl.has(c));
    const base = this.getAttribute('label') || `Keyboard: ${describeKeys(this.getAttribute('keys') ?? DEFAULT_KEYS, this._labels)}`;
    const words = [...hl].filter((c) => this._els[c]).map((c) => keyWord(c, this._labels));
    this._svg.setAttribute('aria-label', base + (words.length ? `. Highlighted: ${words.join(', ')}` : ''));
  }
  _apply() {
    if (!this._svg) return; const on = new Set(this._view.pressed);
    for (const c in this._els) this._els[c].classList.toggle('on', on.has(c));
    if (this._status) {
      const src = this.getAttribute('source');
      this._status.textContent = src === 'live' ? (this.hasAttribute('capture') ? 'Reading keys by position, typing in fields included' : 'Reading keys by position; typing in fields is ignored')
        : src === 'replay' && this._replay ? `Replay ${(this._t || 0).toFixed(2)} s of ${this._replay.duration.toFixed(2)} s` : '';
    }
  }
  /* source="replay": a timeline instead of live keys. `replay` takes a createKeyReplay()
     result (or { frames, map, hold }); set `currentTime` yourself, call playReplay(), or
     syncTo(video, { offset }) to follow a clip. */
  set replay(r) { this._replay = r && typeof r.at === 'function' ? r : r ? createKeyReplay(r.frames || r, r) : null; if (this.getAttribute('source') !== 'replay') this.setAttribute('source', 'replay'); this.currentTime = this._t || 0; }
  get replay() { return this._replay || null; }
  set currentTime(t) { this._t = +t || 0; if (!this._replay) return; const s = this._replay.at(this._replay.start + this._t); this._view = toView(s); this._frame = s.frame; this._apply(); }
  get currentTime() { return this._t || 0; }
  get duration() { return this._replay ? this._replay.duration : 0; }
  syncTo(media, { offset = 0, onFrame } = {}) {
    this._stopReplay?.(); if (!this._replay) return () => {}; const self = this;
    const stop = syncKeysToMedia({ at: (t) => this._replay.at(this._replay.start + t) }, media, { set state(s) { self._t = s.t; self._view = toView(s); self._frame = s.frame; self._apply(); } }, { offset, onFrame });
    this._stopReplay = stop; return stop;
  }
  playReplay({ rate = 1, loop = true } = {}) {
    this._stopReplay?.(); if (!this._replay || typeof requestAnimationFrame !== 'function') return () => {};
    let t0 = null, stopped = false; const d = this._replay.duration;
    const tick = (now) => { if (stopped) return; t0 ??= now - (this._t || 0) * 1000 / rate; let t = (now - t0) / 1000 * rate; if (t > d) { if (!loop) { this.currentTime = d; return; } t0 = now; t = 0; } this.currentTime = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick); this._stopReplay = () => { stopped = true; }; return this._stopReplay;
  }
  _unwire() { this._unsub?.(); this._unsub = null; this._offEv?.(); this._offEv = null; this._hub = null; }
  _wireSource() {
    this._unwire();
    if (this.getAttribute('source') !== 'live' || typeof window === 'undefined') return;
    const hub = (this._hub = createKeyboardHub({ capture: this.hasAttribute('capture') }));
    this._offEv = hub.on((type, d) => this.dispatchEvent(new CustomEvent('tk-keyboard-key', { detail: { code: d.code, down: type === 'down', held: d.held, reason: d.reason ?? null }, bubbles: true, composed: true })));
    this._unsub = hub.subscribe((held) => { this._view = toView(held); this._apply(); });
  }
}

/* "[W] Move forward": a small key cap, then the action, then (effect=) what it does. */
export function capMark(code, labels = null) {
  const dir = { ArrowUp: 0, ArrowRight: 90, ArrowDown: 180, ArrowLeft: 270 }[code];
  if (dir != null) return `<svg viewBox="-8 -8 16 16" aria-hidden="true"><path d="M0 -4.5L4.5 2.5H-4.5Z" transform="rotate(${dir})"/></svg>`;
  return esc(capLabel(code, labels));
}
const CHIP_CSS = `
:host{display:inline-flex;vertical-align:middle;font:600 var(--tk-keyboard-chip-size,13px)/1.1 ${SANS}}
.chip{display:inline-flex;align-items:center;gap:.55em;padding:.3em .8em .3em .3em;border-radius:calc(.65em + 1px);background:${T('chip-bg')};color:${T('chip-ink')};border:1px solid color-mix(in srgb,${T('chip-key')} 35%,transparent);transition:background .25s ease,border-color .25s ease;white-space:nowrap}
.cap{display:inline-grid;place-items:center;box-sizing:border-box;min-width:1.9em;height:1.9em;padding:0 .45em;border-radius:.35em;border:1px solid ${T('chip-key')};border-bottom-width:3px;background:${T('chip-cap')};color:${T('chip-cap-ink')};font:700 .92em/1 ${SANS};transition:background .25s ease,color .25s ease}
.cap svg{width:1em;height:1em;display:block;fill:currentColor}
.a{font-weight:700}
.e{font-weight:500;color:color-mix(in srgb,${T('chip-ink')} 80%,${T('chip-bg')});white-space:normal}.e::before{content:'·';margin-inline-end:.46em;opacity:.7}
:host([lit]) .chip{background:color-mix(in srgb,${T('chip-key')} 22%,${T('chip-bg')});border-color:${T('chip-key')}}
:host([lit]) .cap{background:${T('chip-key')};color:${T('chip-lit-ink')}}
:host([pulse][lit]) .chip{animation:tkkb-chip 1.6s ease-in-out infinite}
@keyframes tkkb-chip{50%{border-color:color-mix(in srgb,${T('chip-key')} 40%,transparent)}}
@media (prefers-reduced-motion:reduce){.chip,.cap{transition:none}:host([pulse][lit]) .chip{animation:none}}
:host([calm]) .chip,:host([calm]) .cap{transition:none}:host([calm][pulse][lit]) .chip{animation:none}
:host([data-motion-paused][pulse][lit]) .chip{animation:none}
@media (forced-colors:active){.cap{border-color:CanvasText}:host([lit]) .cap{background:Highlight;color:HighlightText;border-color:Highlight}}
`;
let CHIP_SHEET = null; const chipSheet = () => (CHIP_SHEET ||= sheet(BASE_CSS + CHIP_CSS));
export class TkKeyPrompt extends HTMLBase {
  static get observedAttributes() { return ['key', 'code', 'action', 'effect', 'label', 'theme', 'lit', 'layout']; }
  constructor() { super(); this._root = attach(this, BASE_CSS + CHIP_CSS, chipSheet); this._labels = null; }
  connectedCallback() { watchMotion(this); this._render(); withLayout(this, () => this._render()); }
  disconnectedCallback() { unwatchMotion(this); }
  attributeChangedCallback(n, o, v) { if (o === v || !this.isConnected) return; if (n === 'layout') { this._labels = this._ownLabels || null; withLayout(this, () => this._render()); } this._render(); }
  set labels(m) { setOwnLabels(this, m); }
  get labels() { return this._labels; }
  /* `key` in HTML; `code` too, because React keeps `key` for itself. */
  get code() { return this.getAttribute('key') || this.getAttribute('code') || 'KeyW'; }
  set code(v) { if (v) this.setAttribute('code', String(v)); else this.removeAttribute('code'); }
  _render() {
    const code = this.code, action = this.getAttribute('action') || '', effect = this.getAttribute('effect') || '', name = this.getAttribute('label') || keyWord(code, this._labels);
    this._root.querySelector('.chip')?.remove();
    const d = document.createElement('span'); d.className = 'chip'; d.setAttribute('role', 'note'); d.setAttribute('aria-label', (action ? `${name}: ${action}` : name) + (effect ? `, ${effect}` : ''));
    d.innerHTML = `<kbd class="cap" aria-hidden="true">${capMark(code, this._labels)}</kbd><span class="a" aria-hidden="true">${esc(action || name)}</span>${effect ? `<span class="e" aria-hidden="true">${esc(effect)}</span>` : ''}`;
    this._root.appendChild(d);
  }
}

export function defineKeyboardElements(reg = globalThis.customElements) {
  if (!reg) return false;
  if (!reg.get('tk-keyboard')) reg.define('tk-keyboard', TkKeyboard);
  if (!reg.get('tk-key-prompt')) reg.define('tk-key-prompt', TkKeyPrompt);
  return true;
}
defineKeyboardElements();
export { createKeyReplay, syncKeysToMedia, KEY_STATES };
export { keyboardSVG, keyboardLayout, UNIT, MAIN, ARROWS, CLUSTERS, DEFAULT_KEYS, KNOWN_CODES, parseKeys, toView, usLabel, capLabel, keyWord, printable, isEditableTarget, createKeyboardHub, layoutLabels };
