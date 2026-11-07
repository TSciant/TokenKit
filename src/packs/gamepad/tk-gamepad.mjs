/* TokenKit gamepad pack: <tk-gamepad>, <tk-button-prompt> and <tk-guitar>.
   Framework-agnostic custom elements. Import once; they define themselves (and do
   nothing on a server, where customElements is missing).

     <tk-gamepad source="live" glyphs="letters" theme="boosty" highlight="up" pulse></tk-gamepad>
     <tk-button-prompt btn="up" action="Fetch"></tk-button-prompt>
     el.state = { pressed: ['south'], lt: 0.4, lx: 0.3, ly: -0.2 }   // or a readPad() result

   Tokens: every colour is a --tk-gamepad-* custom property (they pierce the shadow
   root), and theme="boosty|dark|light" only sets their defaults. */
import { padSVG, guitarSVG, GEO, PAD_VIEWBOX, FRETS } from './gamepad-art.mjs';
import { GLYPHS, GLYPH_SETS, BUTTON_WORDS, STANDARD_BUTTONS, readPad, toView, sharedHub, createGamepadHub, padFamily } from './gamepad-core.mjs';
import { createReplay, syncReplayToMedia, CAR_BALL_DEFAULT } from './gamepad-replay.mjs';

export const THEMES = ['boosty', 'dark', 'light'];
/* theme defaults. A page overrides any of them with its own --tk-gamepad-* values. */
const THEME_CSS = {
  boosty: `--_shell-hi:#2a2533;--_shell:#14111b;--_shell-lo:#07060a;--_rim:#3a3448;--_sheen:rgba(255,255,255,.07);--_well:#050408;--_well-in:#0d0b12;--_btn-hi:#2c2836;--_btn-lo:#16131d;--_btn-ink:#e9e4f5;--_btn-down:#ff3fb4;--_down-ink:#14040e;--_cap-hi:#3a3546;--_cap-lo:#121018;--_trig:#1c1924;--_fill:#ff3fb4;--_accent:#22e4f0;--_led:#22e4f0;--_chev:#6f6880;--_label:#efe9ff;--_chip-bg:rgba(10,8,16,.82);--_chip-ink:#f3efff;--_chip-key:#22e4f0`,
  dark: `--_shell-hi:#4a4d55;--_shell:#2b2e34;--_shell-lo:#17181c;--_rim:#5c6069;--_sheen:rgba(255,255,255,.08);--_well:#0e0f12;--_well-in:#1a1c20;--_btn-hi:#3c3f46;--_btn-lo:#24262b;--_btn-ink:#eef0f4;--_btn-down:#f2c14e;--_down-ink:#201600;--_cap-hi:#4a4d55;--_cap-lo:#1b1d21;--_trig:#30333a;--_fill:#f2c14e;--_accent:#7fb2ff;--_led:#f2f4f8;--_chev:#80848d;--_label:#eef0f4;--_chip-bg:rgba(24,26,30,.9);--_chip-ink:#eef0f4;--_chip-key:#7fb2ff`,
  light: `--_shell-hi:#ffffff;--_shell:#eceef2;--_shell-lo:#c9ccd3;--_rim:#b3b7c0;--_sheen:rgba(255,255,255,.55);--_well:#9fa4ad;--_well-in:#d7dae0;--_btn-hi:#fafbfc;--_btn-lo:#d5d8de;--_btn-ink:#2a2d33;--_btn-down:#2f6fe0;--_down-ink:#ffffff;--_cap-hi:#f4f5f7;--_cap-lo:#a9adb5;--_trig:#dcdfe4;--_fill:#2f6fe0;--_accent:#2f6fe0;--_led:#2f6fe0;--_chev:#8a8f99;--_label:#1d2026;--_chip-bg:rgba(255,255,255,.94);--_chip-ink:#1d2026;--_chip-key:#2f6fe0`,
};
const T = (n) => `var(--tk-gamepad-${n},var(--_${n}))`;
const THEME_RULES = THEMES.map((t) => `:host([theme="${t}"]),:host(:not([theme])) .t-${t}{${THEME_CSS[t]}}`).join('\n');
const BASE_CSS = `
:host{${THEME_CSS.boosty};display:inline-block;position:relative;line-height:1;--_scale:1;vertical-align:middle;-webkit-tap-highlight-color:transparent}
${THEME_RULES}
:host([hidden]){display:none}
svg{display:block;overflow:visible}
.s-hi{stop-color:${T('shell-hi')}}.s-mid{stop-color:${T('shell')}}.s-lo{stop-color:${T('shell-lo')}}
.sh-a{stop-color:${T('sheen')}}.sh-b{stop-color:transparent}
.b-hi{stop-color:${T('btn-hi')}}.b-lo{stop-color:${T('btn-lo')}}
.c-hi{stop-color:${T('cap-hi')}}.c-lo{stop-color:${T('cap-lo')}}
.d-hi{stop-color:${T('cap-lo')}}.d-lo{stop-color:${T('cap-hi')}}
.t-hi{stop-color:${T('btn-hi')}}.t-lo{stop-color:${T('trig')}}
.u-hi{stop-color:${T('btn-hi')}}.u-lo{stop-color:${T('btn-lo')}}
.drop{fill:#000;opacity:.28}
.shell{stroke:none}.sheen{stroke:none}
.rim{fill:none;stroke:${T('rim')};stroke-width:1.2;opacity:.9}
.seam{fill:none;stroke:${T('shell-lo')};stroke-width:1;opacity:.55}
.grip{fill:none;stroke:${T('shell-lo')};stroke-width:1.4;opacity:.45;stroke-linecap:round}
.well{fill:${T('well')}}.wellin{fill:${T('well-in')}}
.bw{fill:${T('well')}}
.bt{stroke:${T('shell-lo')};stroke-width:.8}
.bsh{fill:none;stroke:rgba(255,255,255,.12);stroke-width:1}
.arm .bt{fill:url(#none);fill:${T('btn-hi')}}.crossdrop{fill:#000;opacity:.4}.hub{fill:${T('well-in')}}
.chev{fill:${T('chev')}}
.capsh{fill:#000;opacity:.45}.caprim{fill:none;stroke:rgba(0,0,0,.35);stroke-width:2.2;stroke-dasharray:1.6 1.9}.capdish{stroke:none}
.gl{fill:${T('btn-ink')}}.glt{fill:${T('btn-ink')};font:800 11.5px/1 var(--tk-font-sans,system-ui,sans-serif);letter-spacing:0}
.ic{fill:none;stroke:${T('btn-ink')};stroke-width:.9;stroke-linecap:round}
.homering{fill:none;stroke:${T('btn-ink')};stroke-width:1.2;opacity:.75}
.led{fill:${T('led')}}
.fill{fill:${T('fill')};opacity:.9}
.hl{fill:none;stroke:${T('accent')};stroke-width:2.4;opacity:0;transition:opacity .25s ease}
.b,.stick .cap{transition:transform .08s ease-out}
.b.on .bt{fill:${T('btn-down')}}
.b.on .gl{fill:${T('down-ink')}}.b.on .glt{fill:${T('down-ink')}}.b.on .ic{stroke:${T('down-ink')}}.b.on .chev{fill:${T('down-ink')}}
.arm.on .bt{fill:${T('btn-down')}}
.b.on{transform:translateY(.8px)}
.stick.on .capt{fill:${T('btn-down')}}
.hl.lit,.b.lit>.hl,.stick.lit>.hl{opacity:1}
:host([pulse]) .hl.lit,:host([pulse]) .b.lit>.hl,:host([pulse]) .stick.lit>.hl{animation:tkgp-breathe 1.6s ease-in-out infinite}
@keyframes tkgp-breathe{0%,100%{opacity:1}50%{opacity:.45}}
@media (prefers-reduced-motion:reduce){.hl{transition:none}.b,.stick .cap{transition:none}:host([pulse]) .hl.lit,:host([pulse]) .b.lit>.hl,:host([pulse]) .stick.lit>.hl{animation:none}}
:host([calm]) .hl{transition:none}:host([calm]) .b,:host([calm]) .stick .cap{transition:none}:host([calm][pulse]) .lit,:host([calm][pulse]) .lit>.hl{animation:none}
:host([data-motion-paused][pulse]) .lit,:host([data-motion-paused][pulse]) .lit>.hl{animation:none}
.fr-green{fill:${T('fret-green')}}.fr-red{fill:${T('fret-red')}}.fr-yellow{fill:${T('fret-yellow')}}.fr-blue{fill:${T('fret-blue')}}.fr-orange{fill:${T('fret-orange')}}
.fret.on{transform:translateY(.8px)}.b.fret.on .fr-green{fill:${T('fret-green')};filter:brightness(1.35) saturate(1.15)}.b.fret.on .fr-red{fill:${T('fret-red')};filter:brightness(1.35) saturate(1.15)}.b.fret.on .fr-yellow{fill:${T('fret-yellow')};filter:brightness(1.35) saturate(1.15)}.b.fret.on .fr-blue{fill:${T('fret-blue')};filter:brightness(1.35) saturate(1.15)}.b.fret.on .fr-orange{fill:${T('fret-orange')};filter:brightness(1.35) saturate(1.15)}.knob{fill:${T('btn-lo')};stroke:${T('rim')};stroke-width:.8}.neck{fill:${T('well-in')}}.bar{fill:none;stroke:${T('btn-lo')};stroke-width:4}.hl.bar{stroke-width:6}
.strum .bt{fill:${T('btn-lo')}}
.raw[hidden],.status[hidden]{display:none}
.raw{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;max-width:100%;font:600 11px/1 var(--tk-font-sans,system-ui,sans-serif)}
.raw span{padding:3px 6px;border-radius:6px;background:${T('chip-bg')};color:${T('chip-ink')};border:1px solid ${T('rim')}}
.raw span.on{background:${T('btn-down')};color:${T('down-ink')}}
.raw .note{flex-basis:100%;background:none;border:0;padding:0;color:${T('label')};opacity:.85}
.status{font:600 11px/1.3 var(--tk-font-sans,system-ui,sans-serif);color:${T('label')};opacity:.8;margin-top:4px;text-align:center}
`;
const PAD_CSS = `:host{${'--_fret-green:#3fbf5f;--_fret-red:#e5484d;--_fret-yellow:#f2c94c;--_fret-blue:#3d8bfd;--_fret-orange:#f28c28'}}`;
const sheet = (css) => { try { const s = new CSSStyleSheet(); s.replaceSync(css); return s; } catch { return null; } };
let SHEETS = null; const sheets = () => (SHEETS ||= [sheet(BASE_CSS + PAD_CSS)].filter(Boolean));
const attach = (el) => { const root = el.attachShadow({ mode: 'open' }); const sh = sheets(); if (sh.length && 'adoptedStyleSheets' in root) root.adoptedStyleSheets = sh; else { const st = document.createElement('style'); st.textContent = BASE_CSS + PAD_CSS; root.appendChild(st); } return root; };
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(/[\s,]+/)).filter(Boolean);
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

export class TkGamepad extends HTMLBase {
  static get observedAttributes() { return ['glyphs', 'theme', 'size', 'highlight', 'source', 'index', 'label', 'status']; }
  constructor() { super(); this._root = attach(this); this._uid = 'tkgp' + (++UID); this._view = toView(null); this._unsub = null; this._hub = null; this._pad = null; }
  connectedCallback() { watchMotion(this); this._render(); this._wireSource(); }
  disconnectedCallback() { unwatchMotion(this); this._unsub?.(); this._unsub = null; this._offEv?.(); }
  attributeChangedCallback(n, o, v) { if (o === v || !this.isConnected) return; if (n === 'source' || n === 'index') this._wireSource(); else if (n === 'highlight') this._applyHighlight(); else if (n === 'size') this._applySize(); else this._render(); }
  /* a hand-fed state: { pressed:[...], lt, rt, lx, ly, rx, ry } or a readPad() result */
  set state(s) { this._view = toView(s && s.buttons ? s : s); this._apply(); }
  get state() { return this._view; }
  /* light one or more buttons (outline), as the HUD does for "D-pad up: Fetch" */
  highlight(names, { pulse } = {}) { this.setAttribute('highlight', list(names).join(' ')); if (pulse != null) this.toggleAttribute('pulse', !!pulse); }
  set hub(h) { this._hub = h; this._wireSource(); }
  get pad() { return this._pad; }
  get geometry() { return { viewBox: PAD_VIEWBOX.slice(), geo: GEO }; }
  _render() {
    const glyphs = GLYPH_SETS.includes(this.getAttribute('glyphs')) ? this.getAttribute('glyphs') : 'letters';
    const label = this.getAttribute('label') || 'Gamepad';
    this._root.querySelectorAll('svg,.raw,.status').forEach((n) => n.remove());
    const wrap = document.createElement('div'); wrap.innerHTML = padSVG({ glyphs, uid: this._uid, title: label });
    this._svg = wrap.firstElementChild; this._root.appendChild(this._svg);
    this._raw = document.createElement('div'); this._raw.className = 'raw'; this._raw.hidden = true; this._root.appendChild(this._raw);
    if (this.hasAttribute('status')) { this._status = document.createElement('div'); this._status.className = 'status'; this._status.setAttribute('aria-live', 'polite'); this._root.appendChild(this._status); } else this._status = null;
    this._els = {}; this._svg.querySelectorAll('[data-btn]').forEach((e) => { this._els[e.dataset.btn] = e; });
    this._caps = { ls: this._svg.querySelector('[data-cap="ls"]'), rs: this._svg.querySelector('[data-cap="rs"]') };
    this._fills = { lt: this._svg.querySelector('[data-fill="lt"]'), rt: this._svg.querySelector('[data-fill="rt"]') };
    this._applySize(); this._applyHighlight(); this._apply();
  }
  _applySize() { const s = this.getAttribute('size'); const w = !s ? null : /px|rem|em|%|vw$/.test(s) ? s : (+s > 0 ? Math.round(+s * PAD_VIEWBOX[2]) + 'px' : null);
    if (this._svg) { this._svg.style.width = w || 'var(--tk-gamepad-width, 340px)'; this._svg.style.height = 'auto'; } }
  _applyHighlight() { if (!this._svg) return; const hl = new Set(list(this.getAttribute('highlight')));
    this._svg.querySelectorAll('.lit').forEach((e) => e.classList.remove('lit'));
    for (const n of hl) { if (['up', 'down', 'left', 'right'].includes(n)) this._svg.querySelector(`[data-hl="${n}"]`)?.classList.add('lit'); else if (n === 'dpad') this._svg.querySelectorAll('[data-hl]').forEach((e) => e.classList.add('lit')); else this._els[n]?.classList.add('lit'); }
    const words = [...hl].map((n) => BUTTON_WORDS[n] || n); this._svg.setAttribute('aria-label', (this.getAttribute('label') || 'Gamepad') + (words.length ? '. Highlighted: ' + words.join(', ') : '')); }
  _apply() {
    if (!this._svg) return; const v = this._view, on = new Set(v.pressed);
    for (const n in this._els) { const e = this._els[n]; if (e.classList.contains('b') || e.classList.contains('stick')) e.classList.toggle('on', on.has(n)); }
    for (const s of ['l', 'r']) { const cap = this._caps[s + 's']; if (!cap) continue; const [x, y] = v.sticks[s] || [0, 0]; cap.setAttribute('transform', `translate(${(x * 7).toFixed(2)} ${(y * 7).toFixed(2)})`); }
    for (const k of ['lt', 'rt']) { const fl = this._fills[k]; if (!fl) continue; const g = GEO[k], val = v.values[k] ?? (on.has(k) ? 1 : 0), h = (g.h + 10) * Math.max(0, Math.min(1, val)); fl.setAttribute('height', h.toFixed(2)); fl.setAttribute('y', (g.y + g.h / 2 + 4 - h).toFixed(2)); }
    // a pad with no standard mapping: show its raw buttons as a list, never guess
    if (this._raw) { if (v.raw && !v.standard) { this._raw.hidden = false; this._raw.innerHTML = `<span class="note">Not a standard layout: showing raw buttons</span>` + v.raw.buttons.map((b, i) => `<span class="${b.pressed ? 'on' : ''}">b${i}</span>`).join(''); } else this._raw.hidden = true; }
    if (this._status) this._status.textContent = this._pad ? `Pad ${this._pad.index + 1}: ${this._pad.id}${this._pad.standard ? '' : ' (raw)'}` : (this.getAttribute('source') === 'replay' && this._frame ? `Replay ${(this._t || 0).toFixed(2)} s` : this.getAttribute('source') === 'live' ? 'Press any button on a controller' : '');
  }
  /* source="replay": a timeline instead of the Gamepad API. `replay` takes a createReplay()
     result (or { frames, map, hold }); set `currentTime` yourself, call playReplay(), or
     syncTo(video, { offset }) to follow a clip. */
  set replay(r) { this._replay = r && typeof r.at === 'function' ? r : r ? createReplay(r.frames || r, r) : null; if (this.getAttribute('source') !== 'replay') this.setAttribute('source', 'replay'); this.currentTime = this._t || 0; }
  get replay() { return this._replay || null; }
  set currentTime(t) { this._t = +t || 0; if (!this._replay) return; const s = this._replay.at(this._replay.start + this._t); this._view = toView(s); this._frame = s.frame; this._apply(); }
  get currentTime() { return this._t || 0; }
  get duration() { return this._replay ? this._replay.duration : 0; }
  syncTo(media, { offset = 0, onFrame } = {}) { this._unsub?.(); if (!this._replay) return () => {}; const self = this;
    const stop = syncReplayToMedia({ at: (t) => this._replay.at(this._replay.start + t) }, media, { set state(s) { self._t = s.t; self._view = toView(s); self._frame = s.frame; self._apply(); } }, { offset, onFrame });
    this._unsub = stop; return stop; }
  playReplay({ rate = 1, loop = true } = {}) { this._unsub?.(); if (!this._replay || typeof requestAnimationFrame !== 'function') return () => {};
    let t0 = null, stopped = false; const d = this._replay.duration;
    const tick = (now) => { if (stopped) return; t0 ??= now - (this._t || 0) * 1000 / rate; let t = (now - t0) / 1000 * rate; if (t > d) { if (!loop) { this.currentTime = d; return; } t0 = now; t = 0; } this.currentTime = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick); this._unsub = () => { stopped = true; }; return this._unsub; }
  _wireSource() {
    this._unsub?.(); this._unsub = null; this._offEv?.(); this._offEv = null;
    if (this.getAttribute('source') !== 'live' || typeof window === 'undefined') return;
    const hub = this._hub || sharedHub(); const want = this.getAttribute('index');
    const pick = (all) => (want != null && want !== 'any' ? all.find((p) => p.index === +want) : all[0]) || null;
    this._unsub = hub.subscribe((all) => { const p = pick(all); this._pad = p; this._view = toView(p); this._apply(); });
    this._offEv = hub.on((type, pad) => this.dispatchEvent(new CustomEvent('tk-gamepad-' + type, { detail: pad, bubbles: true, composed: true })));
  }
}

/* "D-pad up: Fetch": a small picture of the control, then its name, then the action, then (effect=) what it does. */
export function buttonIcon(btn, glyphs = 'letters') {
  const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[btn];
  if (dir) { const [dx, dy] = dir; return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><path class="ix" d="M-3.6 -10.5h7.2v7h7v7.2h-7v6.8h-7.2v-6.8h-7v-7.2h7z"/><rect class="ia" x="${(dx * 7 - 3.6).toFixed(1)}" y="${(dy * 7 - 3.6).toFixed(1)}" width="7.2" height="7.2" rx="1.4"/></svg>`; }
  if (btn === 'ls' || btn === 'rs' || btn === 'lstick' || btn === 'rstick') return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle class="ix" r="10.5"/><circle class="ia" r="6"/><text x="0" y="3.2" text-anchor="middle" class="it">${btn[0] === 'l' ? 'L' : 'R'}</text></svg>`;
  if (GLYPHS.letters[btn]) { const g = GLYPHS[glyphs] || GLYPHS.letters, gl = g[btn];
    const mark = glyphs === 'shapes' ? ({ circle: '<circle class="ig" r="4.2"/>', square: '<rect class="ig" x="-3.8" y="-3.8" width="7.6" height="7.6" rx="1"/>', diamond: '<path class="ig" d="M0-5.2L5.2 0 0 5.2-5.2 0z"/>', triangle: '<path class="ig" d="M0-5 5 3.8H-5z"/>' })[gl] : `<text x="0" y="4.3" text-anchor="middle" class="il">${gl}</text>`;
    return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle class="ia" r="12"/>${mark}</svg>`; }
  if (btn === 'lt' || btn === 'rt') return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><path class="ia" d="M-8 9V-3Q0-12 8-3V9Z"/><text x="0" y="5" text-anchor="middle" class="it">${btn === 'lt' ? 'L' : 'R'}</text></svg>`;
  if (btn === 'lb' || btn === 'rb') return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><rect class="ia" x="-11" y="-5" width="22" height="10" rx="5"/><text x="0" y="3.2" text-anchor="middle" class="it">${btn === 'lb' ? 'L' : 'R'}</text></svg>`;
  if (btn === 'dpad') return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><path class="ia" d="M-3.6 -10.5h7.2v7h7v7.2h-7v6.8h-7.2v-6.8h-7v-7.2h7z"/></svg>`;
  if (/^fret[1-5]$/.test(btn)) { const c = FRETS[+btn[4] - 1]; return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><rect class="fr-${c}" x="-8" y="-8" width="16" height="16" rx="3.5"/></svg>`; }
  return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><rect class="ia" x="-9" y="-5.5" width="18" height="11" rx="5.5"/></svg>`;
}
const CHIP_CSS = `
:host{display:inline-flex;vertical-align:middle;font:600 var(--tk-gamepad-chip-size,13px)/1.1 var(--tk-font-sans,system-ui,sans-serif)}
.chip{display:inline-flex;align-items:center;gap:.615em;padding:.385em .923em .385em .385em;border-radius:999px;background:${T('chip-bg')};color:${T('chip-ink')};border:1px solid color-mix(in srgb,${T('chip-key')} 35%,transparent);transition:background .25s ease,border-color .25s ease;white-space:nowrap}
svg{width:1.692em;height:1.692em;flex:none;display:block}
.ix{fill:none;stroke:${T('chip-key')};stroke-width:1.3;opacity:.7}.ia{fill:${T('chip-key')}}.ig{fill:${T('chip-bg')}}.it{fill:${T('chip-bg')};font:900 9.5px/1 var(--tk-font-sans,system-ui,sans-serif)}.il{fill:${T('chip-bg')};font:800 12px/1 var(--tk-font-sans,Inter,system-ui,sans-serif)}
.k{opacity:.82;font-weight:600}.a{font-weight:700}
.e{font-weight:500;color:color-mix(in srgb,${T('chip-ink')} 80%,${T('chip-bg')});white-space:normal}.e::before{content:'·';margin-inline-end:.46em;opacity:.7}
:host([terse]) .k{display:none}
:host([lit]) .chip{background:color-mix(in srgb,${T('chip-key')} 26%,${T('chip-bg')});border-color:${T('chip-key')}}
:host([pulse][lit]) .chip{animation:tkgp-chip 1.6s ease-in-out infinite}
@keyframes tkgp-chip{50%{border-color:color-mix(in srgb,${T('chip-key')} 40%,transparent)}}
@media (prefers-reduced-motion:reduce){.chip{transition:none}:host([pulse][lit]) .chip{animation:none}}
:host([data-motion-paused][pulse][lit]) .chip{animation:none}
.fr-green{fill:${T('fret-green')}}.fr-red{fill:${T('fret-red')}}.fr-yellow{fill:${T('fret-yellow')}}.fr-blue{fill:${T('fret-blue')}}.fr-orange{fill:${T('fret-orange')}}
`;
let CHIP_SHEET = null;
export class TkButtonPrompt extends HTMLBase {
  static get observedAttributes() { return ['btn', 'action', 'effect', 'label', 'glyphs', 'theme', 'lit', 'terse']; }
  constructor() { super(); this._root = this.attachShadow({ mode: 'open' }); const s = (CHIP_SHEET ||= sheet(BASE_CSS + PAD_CSS + CHIP_CSS)); if (s && 'adoptedStyleSheets' in this._root) this._root.adoptedStyleSheets = [s]; else { const st = document.createElement('style'); st.textContent = BASE_CSS + PAD_CSS + CHIP_CSS; this._root.appendChild(st); } }
  connectedCallback() { watchMotion(this); this._render(); }
  disconnectedCallback() { unwatchMotion(this); }
  attributeChangedCallback() { if (this.isConnected) this._render(); }
  _render() {
    const btn = this.getAttribute('btn') || 'south', action = this.getAttribute('action') || '', effect = this.getAttribute('effect') || '', name = this.getAttribute('label') || BUTTON_WORDS[btn] || btn;
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    this._root.querySelector('.chip')?.remove();
    const d = document.createElement('span'); d.className = 'chip'; d.setAttribute('role', 'note'); d.setAttribute('aria-label', (action ? `${name}: ${action}` : name) + (effect ? `, ${effect}` : ''));
    d.innerHTML = buttonIcon(btn, this.getAttribute('glyphs') || 'letters') + `<span class="k">${esc(name)}${action ? ':' : ''}</span>${action ? `<span class="a">${esc(action)}</span>` : ''}${effect ? `<span class="e">${esc(effect)}</span>` : ''}`;
    this._root.appendChild(d);
  }
}

export class TkGuitar extends HTMLBase {
  static get observedAttributes() { return ['theme', 'size', 'highlight', 'label']; }
  constructor() { super(); this._root = attach(this); this._uid = 'tkgt' + (++UID); this._pressed = new Set(); }
  connectedCallback() { this._render(); }
  attributeChangedCallback() { if (this.isConnected) this._render(); }
  set state(s) { this._pressed = new Set(list(s?.pressed)); this._apply(); }
  _render() { this._root.querySelector('svg')?.remove(); const w = document.createElement('div'); w.innerHTML = guitarSVG({ uid: this._uid, title: this.getAttribute('label') || 'Guitar controller' }); this._svg = w.firstElementChild; this._root.appendChild(this._svg);
    const s = this.getAttribute('size'); this._svg.style.width = s ? (/[a-z%]$/.test(s) ? s : Math.round(+s * 200) + 'px') : 'var(--tk-gamepad-guitar-width, 160px)';
    const hl = new Set(list(this.getAttribute('highlight'))); this._svg.querySelectorAll('[data-btn]').forEach((e) => e.classList.toggle('lit', hl.has(e.dataset.btn))); this._apply(); }
  _apply() { this._svg?.querySelectorAll('[data-btn]').forEach((e) => e.classList.toggle('on', this._pressed.has(e.dataset.btn))); }
}

export function defineGamepadElements(reg = globalThis.customElements) {
  if (!reg) return false;
  if (!reg.get('tk-gamepad')) reg.define('tk-gamepad', TkGamepad);
  if (!reg.get('tk-button-prompt')) reg.define('tk-button-prompt', TkButtonPrompt);
  if (!reg.get('tk-guitar')) reg.define('tk-guitar', TkGuitar);
  return true;
}
defineGamepadElements();
export { createReplay, syncReplayToMedia, CAR_BALL_DEFAULT };
export { padSVG, guitarSVG, GEO, PAD_VIEWBOX, GLYPHS, GLYPH_SETS, BUTTON_WORDS, STANDARD_BUTTONS, readPad, toView, sharedHub, createGamepadHub, padFamily };
