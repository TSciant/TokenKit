/* TokenKit instruments pack: <tk-guitar-neck>, a playable 3D guitar neck.
   A modelled six-string neck in three.js at true proportions: a 25.5" scale with frets
   at their exact distances, a 12" radius rosewood board, nickel frets, pearl inlays,
   strings at their real gauges and a 3+3 headstock. Every string and fret is bound to
   its note in standard tuning; with `sound`, playing it sounds a real recording
   (guitar-tone.mjs). Without `sound` it fetches nothing.

     <tk-guitar-neck frets="12" sound highlight="s6f5 s5f7" label="A minor box"></tk-guitar-neck>
     el.state = { pressed: ['s6f5'] }            // fretted positions, shown as fingertips
     el.state = { pressed: ['fret1', 'strum'] }  // a 5-fret controller, through el.binding
     el.pluck(6, 5)                              // play one; also by click, drag or keys
     el.addEventListener('tk-guitar-note', (e) => e.detail)  // { string, fret, midi, name, frequency }

   Positions are "s{string}f{fret}": strings as players number them (1 high e .. 6 low E),
   fret 0 = open. High e is drawn on top, as in tab. Keys: arrows move, Space or Enter
   plays, Home goes to the open string. Motion (string vibration, the highlight's breath)
   is off under prefers-reduced-motion, `calm` and the kit's motion pause. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { STANDARD_TUNING, SCALE_MM, DEFAULT_BINDING, noteAt, noteName, spokenName, frequency, fretDistance, posName, parsePos, frettedBy, createGuitarSampler } from './guitar-tone.mjs';

const HTMLBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(/[\s,]+/)).filter(Boolean);

/* Theme defaults, as the other gamepad elements use; any --tk-gamepad-* property wins. */
const THEME = {
  boosty: { accent: '#22e4f0', down: '#ff3fb4', label: '#efe9ff' },
  dark: { accent: '#7fb2ff', down: '#f2c14e', label: '#eef0f4' },
  light: { accent: '#2f6fe0', down: '#2f6fe0', label: '#1d2026' },
};

/* Proportions, in millimetres. */
const GAUGE_IN = [null, 0.010, 0.013, 0.017, 0.026, 0.036, 0.046];
const BOARD_T = 6, RADIUS = 305, NUT_W = 43, BRIDGE_SPREAD = 52, NUT_SPREAD = 35, FRET_R = 1.05;
const INLAYS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
const boardWidth = (x) => NUT_W + (56.5 - NUT_W) * (x / fretDistance(22));
const crown = (z) => BOARD_T - (RADIUS - Math.sqrt(RADIUS * RADIUS - z * z));
/** Where string s crosses x (z across the neck: string 6 toward the viewer). */
const stringZ = (s, x) => ((s - 3.5) / 5) * (NUT_SPREAD + (BRIDGE_SPREAD - NUT_SPREAD) * (x / SCALE_MM));
const stringY = (x) => BOARD_T + FRET_R + 0.55 + x * 0.0042;
/** Where a fingertip sits for a position: just behind its fret wire (open: at the nut). */
const fingerX = (fret) => (fret === 0 ? -7 : fretDistance(fret) - 0.32 * (fretDistance(fret) - fretDistance(fret - 1)));

/* A seeded random, so the wood grain is the same on every load (and in screenshots). */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function woodTexture(base, streak, seed, w = 1024, h = 256) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); if (!g) return null;
  const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    const y = r() * h, th = 0.4 + r() * 2.2, a = 0.05 + r() * 0.16, wav = r() * 6, ph = r() * 6.28;
    g.strokeStyle = streak; g.globalAlpha = a; g.lineWidth = th; g.beginPath();
    for (let x = 0; x <= w; x += 16) { const yy = y + Math.sin(x / (90 + wav * 30) + ph) * wav; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
    g.stroke();
  }
  for (let i = 0; i < 90; i++) { g.globalAlpha = 0.05 + r() * 0.08; g.fillStyle = streak; g.fillRect(r() * w, r() * h, 6 + r() * 40, 0.8 + r()); }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

/* A surface swept along x: profile(v, x) -> [z, y] for v in 0..1. */
function sweep(x0, x1, nx, nv, profile, { capEnd = false } = {}) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= nx; i++) {
    const x = x0 + ((x1 - x0) * i) / nx;
    for (let j = 0; j <= nv; j++) { const [z, y] = profile(j / nv, x); pos.push(x, y, z); uv.push(i / nx, j / nv); }
  }
  const row = nv + 1;
  // wound so the outside faces out when the profile runs counter-clockwise seen from +x
  for (let i = 0; i < nx; i++) for (let j = 0; j < nv; j++) { const a = i * row + j, b = a + row; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  if (!capEnd) return g;
  // a flat end cap on its own vertices (so the edge stays crisp), facing +x
  const ring = []; let cz = 0, cy = 0;
  for (let j = 0; j <= nv; j++) { const k = (nx * row + j) * 3; ring.push([pos[k + 1], pos[k + 2]]); cy += pos[k + 1]; cz += pos[k + 2]; }
  const cp = [x1, cy / row, cz / row], cpos = [...cp], cidx = [];
  for (const [y, z] of ring) cpos.push(x1, y, z);
  for (let j = 1; j <= nv; j++) cidx.push(0, j, j + 1);
  const cap = new THREE.BufferGeometry(); cap.setAttribute('position', new THREE.Float32BufferAttribute(cpos, 3));
  cap.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((cpos.length / 3) * 2).fill(0.5), 2)); cap.setIndex(cidx); cap.computeVertexNormals();
  if (cap.attributes.normal.getX(1) < 0) { for (let t = 0; t < cidx.length; t += 3) [cidx[t + 1], cidx[t + 2]] = [cidx[t + 2], cidx[t + 1]]; cap.setIndex(cidx); cap.computeVertexNormals(); }
  return [g, cap];
}

const CSS = `
:host{display:block;position:relative;width:var(--tk-guitar-neck-width,100%);max-width:100%;outline:none;border-radius:10px;-webkit-tap-highlight-color:transparent;touch-action:none}
:host([hidden]){display:none}
:host(:focus-visible){box-shadow:0 0 0 3px var(--tk-gamepad-accent,var(--_accent,#22e4f0))}
.stage{position:relative;width:100%;aspect-ratio:var(--tk-guitar-neck-aspect,5)}
canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;cursor:pointer}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.fallback{position:absolute;inset:0;display:grid;place-items:center;font:600 13px/1.4 var(--tk-font-sans,system-ui,sans-serif);color:var(--tk-gamepad-label,#efe9ff);opacity:.8;text-align:center;padding:12px}
.readout{position:absolute;right:10px;bottom:8px;font:700 13px/1 var(--tk-font-sans,system-ui,sans-serif);letter-spacing:.02em;color:var(--tk-gamepad-label,var(--_label,#efe9ff));opacity:0;transition:opacity .25s ease;pointer-events:none;text-shadow:0 1px 2px #0008}
.readout.on{opacity:.9}
:host([calm]) .readout{transition:none}
@media (prefers-reduced-motion:reduce){.readout{transition:none}}
`;

let UID = 0;
export class TkGuitarNeck extends HTMLBase {
  static get observedAttributes() { return ['frets', 'highlight', 'pulse', 'calm', 'theme', 'label', 'size', 'sound']; }
  constructor() {
    super(); this._uid = 'tkgn' + (++UID);
    this._held = new Set(); this._pressedRaw = new Set(); this._binding = { ...DEFAULT_BINDING };
    this._cursor = { string: 6, fret: 0 }; this._vib = new Map(); this._frame = 0;
    if (!this.attachShadow) return;
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = `<style>${CSS}</style><div class="stage"></div><div class="readout" aria-hidden="true"></div><div class="sr" aria-live="polite"></div>`;
    this._stage = this._root.querySelector('.stage'); this._live = this._root.querySelector('.sr'); this._readout = this._root.querySelector('.readout');
  }
  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.setAttribute('role', 'application'); this.setAttribute('aria-roledescription', 'guitar neck');
    this._label(); this._sizeHost(); this._build();
    this._onKey = (e) => this._key(e); this.addEventListener('keydown', this._onKey);
    this._onFocus = () => this._invalidate(); this.addEventListener('focus', this._onFocus); this.addEventListener('blur', this._onFocus);
    this._mq = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    this._mo = typeof MutationObserver === 'function' ? new MutationObserver(() => this._invalidate()) : null;
    this._mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  }
  disconnectedCallback() {
    this.removeEventListener('keydown', this._onKey); this.removeEventListener('focus', this._onFocus); this.removeEventListener('blur', this._onFocus);
    this._mo?.disconnect(); this._teardown(); this._sampler?.stop();
  }
  attributeChangedCallback(n, o, v) {
    if (o === v || !this.isConnected) return;
    if (n === 'frets') { this._teardown(); this._build(); }
    else if (n === 'label') this._label();
    else if (n === 'size') this._sizeHost();
    else if (n === 'sound') { if (v != null) this._ensureSampler(); }
    else { this._applyTheme(); this._applyMarkers(); }
  }

  /* ---- public ---- */
  /** { pressed: [...] }: fretted positions ("s6f5") and/or controller buttons (fret1..5, strum). */
  set state(s) {
    const next = new Set(list(s?.pressed));
    const strumNow = next.has('strum') && !this._pressedRaw.has('strum');
    this._pressedRaw = next;
    this._held = new Set([...next].filter((p) => parsePos(p)).concat(frettedBy([...next], this._binding)));
    this._applyMarkers();
    if (strumNow) this.strum();
  }
  get state() { return { pressed: [...this._pressedRaw] }; }
  /** Controller button -> position, e.g. { fret1: 's6f5' }. */
  set binding(b) { this._binding = { ...(b || DEFAULT_BINDING) }; this.state = { pressed: [...this._pressedRaw] }; }
  get binding() { return { ...this._binding }; }
  /** Play one position. Returns the note's detail (and sounds it with `sound`). */
  pluck(string, fret = 0, { velocity = 0.8, when = 0 } = {}) {
    const midi = noteAt(string, fret); if (midi == null || fret > this._frets()) return null;
    const detail = { string, fret, midi, name: noteName(midi), frequency: frequency(midi) };
    if (this.hasAttribute('sound')) this._ensureSampler()?.play(midi, { string, velocity, when }).catch(() => {});
    this._vibrate(string, fret);
    this._say(`String ${string}, ${fret ? 'fret ' + fret : 'open'}, ${spokenName(midi)}`, `${noteName(midi)}  s${string} f${fret}`);
    this.dispatchEvent(new CustomEvent('tk-guitar-note', { detail, bubbles: true, composed: true }));
    return detail;
  }
  /** Play what is held, low string to high, one note per string (the highest fret wins, as on a guitar). */
  strum(positions = [...this._held], { gap = 0.014 } = {}) {
    const top = new Map();
    for (const p of positions) { const q = parsePos(p); if (q && (top.get(q.string) ?? -1) < q.fret) top.set(q.string, q.fret); }
    const order = [...top.keys()].sort((a, b) => b - a);
    const t0 = this._sampler?.context?.currentTime || 0;
    return order.map((s, i) => this.pluck(s, top.get(s), { when: t0 ? t0 + i * gap : 0 })).filter(Boolean);
  }
  /** Fetch the recordings now rather than on the first note (needs `sound`). */
  loadSound() { return this._ensureSampler()?.load() ?? Promise.resolve(false); }
  /** The 3D scene, for a page that wants to restyle it. */
  get scene() { return this._scene || null; }

  /* ---- build ---- */
  _frets() { const f = parseInt(this.getAttribute('frets'), 10); return Number.isFinite(f) ? Math.max(5, Math.min(22, f)) : 12; }
  _label() {
    const name = this.getAttribute('label') || 'Guitar neck';
    this.setAttribute('aria-label', `${name}. Arrow keys move along the strings and frets, Space plays, Home goes to the open string.`);
  }
  _sizeHost() { const s = this.getAttribute('size'); this.style.setProperty('--tk-guitar-neck-width', s ? (/[a-z%]$/.test(s) ? s : Math.round(+s * 640) + 'px') : ''); }
  _ensureSampler() { return (this._sampler ||= createGuitarSampler()); }
  _motion() { return !this.hasAttribute('calm') && !this._mq?.matches && document.documentElement.getAttribute('data-motion') !== 'paused'; }
  _colors() {
    const cs = getComputedStyle(this), th = THEME[this.getAttribute('theme')] || THEME.boosty;
    const v = (n, d) => cs.getPropertyValue(`--tk-gamepad-${n}`).trim() || d;
    return { accent: v('accent', th.accent), down: v('btn-down', th.down) };
  }

  _build() {
    if (!this._stage || this._renderer) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { this._stage.innerHTML = `<div class="fallback">This guitar neck needs WebGL, which this browser has turned off.</div>`; return; }
    this._renderer = renderer;
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._stage.appendChild(renderer.domElement);

    // the model runs on past the view toward the body, so the neck leaves the frame as a real one does
    const N = this._frets(), END = fretDistance(N) + 16, HEAD = -96, MODEL = END + 90;
    this._end = END; this._model = MODEL;
    const scene = (this._scene = new THREE.Scene());
    const pm = new THREE.PMREMGenerator(renderer); this._env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    scene.environment = this._env;
    const key = new THREE.DirectionalLight(0xfff4e6, 2.4); key.position.set(END * 0.3, 260, 140); key.target.position.set(END * 0.4, 0, 0);
    key.castShadow = true; key.shadow.mapSize.set(2048, 512); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
    Object.assign(key.shadow.camera, { left: -END * 0.7, right: END * 0.7, top: 70, bottom: -70, near: 100, far: 500 });
    scene.add(key, key.target, new THREE.HemisphereLight(0xe8eefc, 0x2a1d14, 0.55));

    const rose = new THREE.MeshStandardMaterial({ color: 0x5a3626, map: woodTexture('#5b3726', '#24130b', 7), roughness: 0.62, metalness: 0 });
    const maple = new THREE.MeshStandardMaterial({ color: 0xe9c79a, map: woodTexture('#e3c08f', '#b98a55', 11), roughness: 0.38, metalness: 0 });
    const face = new THREE.MeshStandardMaterial({ color: 0x15110f, roughness: 0.22, metalness: 0.1 });
    const nickel = new THREE.MeshStandardMaterial({ color: 0xd8d8d4, roughness: 0.22, metalness: 1 });
    const bronze = new THREE.MeshStandardMaterial({ color: 0xc9ab7c, roughness: 0.3, metalness: 1 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.18, metalness: 1 });
    const pearl = new THREE.MeshPhysicalMaterial({ color: 0xf4efe4, roughness: 0.3, sheen: 1, sheenColor: 0xd9e7ff, iridescence: 0.6, clearcoat: 0.6 });
    const bone = new THREE.MeshStandardMaterial({ color: 0xf1e9d6, roughness: 0.45 });
    const keyMat = new THREE.MeshPhysicalMaterial({ color: 0xece4d2, roughness: 0.25, clearcoat: 0.8 });
    this._mats = [rose, maple, face, nickel, bronze, steel, pearl, bone, keyMat];
    const add = (geo, mat, { cast = false, receive = false } = {}) => {
      if (Array.isArray(geo)) return geo.map((g) => add(g, mat, { cast, receive }))[0];
      const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; scene.add(m); return m;
    };

    // fingerboard: up the bass-side edge, across the radiused top, down the treble edge
    const SIDE = 0.12;
    add(sweep(0, MODEL, 56, 40, (v, x) => {
      const w = boardWidth(x) / 2;
      if (v < SIDE) return [-w, -0.6 + (crown(w) + 0.6) * (v / SIDE)];
      if (v > 1 - SIDE) return [w, -0.6 + (crown(w) + 0.6) * ((1 - v) / SIDE)];
      const z = -w + 2 * w * ((v - SIDE) / (1 - 2 * SIDE)); return [z, crown(z)];
    }, { capEnd: true }), rose, { receive: true });
    // back of the neck in maple, a soft C that deepens toward the body
    add(sweep(-4, MODEL, 56, 28, (v, x) => { const a = Math.PI * v, w = boardWidth(Math.max(0, x)) / 2; return [Math.cos(a) * w, -0.6 - Math.sin(a) * (19 + x * 0.006)]; }, { capEnd: true }), maple, { receive: true });
    // headstock: a black-faced plate, angled back a little, with 3+3 tuner posts
    const head = new THREE.Shape(); const hw = (x) => (x > -14 ? NUT_W / 2 : NUT_W / 2 + Math.min(1, (-14 - x) / 26) * 20);
    head.moveTo(0, -NUT_W / 2); for (let x = -2; x >= HEAD; x -= 4) head.lineTo(x, -hw(x));
    head.quadraticCurveTo(HEAD - 14, 0, HEAD, hw(HEAD)); for (let x = HEAD; x <= 0; x += 4) head.lineTo(x, hw(x)); head.lineTo(0, NUT_W / 2);
    const hg = new THREE.ExtrudeGeometry(head, { depth: 13, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 3, curveSegments: 18 });
    hg.rotateX(Math.PI / 2); hg.translate(0, 2.2, 0); add(hg, face, { receive: true });
    // nut
    const nutG = new THREE.BoxGeometry(4, 5, NUT_W); nutG.translate(-2, stringY(0) - 0.25 - 2.5, 0); add(nutG, bone, { cast: true });
    // frets: crowned wires that follow the board's radius
    for (let n = 1; n <= N; n++) {
      const x = fretDistance(n), w = boardWidth(x) / 2 - 0.4;
      const pts = Array.from({ length: 13 }, (_, i) => { const z = -w + (2 * w * i) / 12; return new THREE.Vector3(x, crown(z), z); });
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, FRET_R, 10, false), nickel, { cast: true, receive: true });
    }
    // inlays: pearl dots, a pair at 12
    for (const f of INLAYS.filter((f) => f <= N)) {
      const x = (fretDistance(f) + fretDistance(f - 1)) / 2;
      for (const z of f === 12 ? [-boardWidth(x) * 0.22, boardWidth(x) * 0.22] : [0]) {
        const d = new THREE.CylinderGeometry(3.1, 3.1, 0.4, 32); d.translate(x, crown(z) + 0.02, z); add(d, pearl, { receive: true });
      }
    }
    // strings: wound (bronze) 6..4, plain steel 3..1; vibrating length from nut to the view's end
    const POSTX = [null, -30, -52, -74, -74, -52, -30];
    this._strings = [];
    for (let s = 1; s <= 6; s++) {
      const r = Math.max(0.24, (GAUGE_IN[s] * 25.4) / 2) * 1.15, mat = s >= 4 ? bronze : steel;
      const start = new THREE.Vector3(0, stringY(0), stringZ(s, 0)), end = new THREE.Vector3(MODEL, stringY(MODEL), stringZ(s, MODEL));
      const g = new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 160, r, 8, false);
      const mesh = add(g, mat, { cast: true }); mesh.userData.string = s;
      this._strings[s] = { mesh, base: Float32Array.from(g.attributes.position.array) };
      // nut to tuner post
      // posts in a line, as on a 3+3 headstock, so each string clears the posts nearer the nut
      const side = s >= 4 ? 1 : -1, post = new THREE.Vector3(POSTX[s], 6, side * 24);
      add(new THREE.TubeGeometry(new THREE.LineCurve3(start, post), 8, r, 8, false), mat, { cast: true });
      const pg = new THREE.CylinderGeometry(3, 3.4, 12, 20); pg.translate(post.x, 6, post.z); add(pg, nickel, { cast: true });
      const bg = new THREE.CylinderGeometry(5.2, 5.2, 2, 24); bg.translate(post.x, 2.8, post.z); add(bg, nickel);
      // the tuner on the back, its shaft and key sticking out past the edge
      const sh = new THREE.CylinderGeometry(1.6, 1.6, 14, 12); sh.rotateX(Math.PI / 2); sh.translate(post.x, -6, side * (hw(post.x) + 5)); add(sh, nickel, { cast: true });
      const kb = new THREE.SphereGeometry(6.5, 24, 14); kb.scale(0.55, 1, 1.25); kb.translate(post.x, -6, side * (hw(post.x) + 16)); add(kb, keyMat, { cast: true });
      const hs = new THREE.BoxGeometry(11, 11, 9); hs.translate(post.x, -6.5 - 2, side * (hw(post.x) - 2)); add(hs, nickel, { cast: true });
    }
    // markers: fingertips (held) and rings (highlight), pooled
    this._tipGeo = new THREE.SphereGeometry(4.4, 24, 12); this._tipGeo.scale(1.2, 0.42, 1);
    this._ringGeo = new THREE.TorusGeometry(6.2, 0.75, 10, 40); this._ringGeo.rotateX(Math.PI / 2);
    this._tipMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0, transparent: true, opacity: 0.92 });
    this._ringMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, toneMapped: false });
    this._cursorMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, toneMapped: false });
    this._markers = new THREE.Group(); scene.add(this._markers);
    this._cursorMesh = new THREE.Mesh(this._ringGeo, this._cursorMat); this._cursorMesh.scale.setScalar(0.8); scene.add(this._cursorMesh);

    // camera: looking down at the neck, a little from the low-E side, high e on top
    const cx = (HEAD - 14 + END) / 2, span = END - HEAD + 14;
    const cam = (this._camera = new THREE.PerspectiveCamera(22, 5, 10, 3000));
    this._fit = () => {
      const w = this._stage.clientWidth || 640, h = this._stage.clientHeight || 190; cam.aspect = w / h;
      const hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect);
      const dist = Math.max((span / 2) / Math.tan(hf / 2), 50 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) * 1.03;
      // tilted about 30 degrees toward the low-E side, as a player glancing down sees it
      cam.position.set(cx, dist * 0.87, dist * 0.5); cam.lookAt(cx, -2, 3); cam.updateProjectionMatrix();
      renderer.setSize(w, h, false); this._invalidate();
    };
    this._ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._fit()) : null; this._ro?.observe(this._stage);
    this._fit();

    // pointer: tap or drag across strings to play
    const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -stringY(150)), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
    const at = (e) => {
      const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam); if (!ray.ray.intersectPlane(plane, hit)) return null;
      return this._posAt(hit.x, hit.z);
    };
    let last = null;
    this._onDown = (e) => { const p = at(e); if (!p) return; e.preventDefault(); this.focus({ preventScroll: true }); renderer.domElement.setPointerCapture?.(e.pointerId); last = posName(p.string, p.fret); this._cursor = p; this.pluck(p.string, p.fret); };
    this._onMove = (e) => { if (!last) return; const p = at(e); if (!p) return; const n = posName(p.string, p.fret); if (n !== last && p.string !== parsePos(last).string) { last = n; this._cursor = p; this.pluck(p.string, p.fret, { velocity: 0.65 }); } };
    this._onUp = () => { last = null; };
    renderer.domElement.addEventListener('pointerdown', this._onDown); renderer.domElement.addEventListener('pointermove', this._onMove);
    renderer.domElement.addEventListener('pointerup', this._onUp); renderer.domElement.addEventListener('pointercancel', this._onUp);

    this._applyTheme(); this._applyMarkers();
  }
  _teardown() {
    cancelAnimationFrame(this._frame); this._frame = 0; this._ro?.disconnect(); this._ro = null;
    if (!this._renderer) return;
    this._scene.traverse((o) => { o.geometry?.dispose(); });
    for (const m of [...this._mats, this._tipMat, this._ringMat, this._cursorMat]) { m.map?.dispose(); m.dispose(); }
    this._env?.dispose(); this._renderer.dispose(); this._renderer.domElement.remove();
    this._renderer = this._scene = this._camera = null; this._vib.clear();
  }
  /** World x, z -> the nearest string and the fret space under it (left of the nut or past the last fret = open). */
  _posAt(x, z) {
    const N = this._frets();
    if (x < -40 || x > this._end + 12) return null;
    let s = 1, best = Infinity;
    for (let i = 1; i <= 6; i++) { const d = Math.abs(z - stringZ(i, Math.max(0, x))); if (d < best) { best = d; s = i; } }
    if (best > 9) return null;
    let fret = 0; if (x > 0 && x <= fretDistance(N)) { fret = 1; while (fret < N && fretDistance(fret) < x) fret++; }
    return { string: s, fret };
  }

  /* ---- markers and theme ---- */
  _applyTheme() {
    if (!this._renderer) return; const c = this._colors();
    this._tipMat.color.set(c.down); this._ringMat.color.set(c.accent); this._cursorMat.color.set(c.accent); this._invalidate();
  }
  _place(mesh, string, fret, lift) { const x = fingerX(fret); mesh.position.set(x, stringY(Math.max(0, x)) + lift, stringZ(string, Math.max(0, x))); }
  _applyMarkers() {
    if (!this._renderer) return;
    const g = this._markers; for (const m of [...g.children]) g.remove(m);
    const N = this._frets();
    for (const p of this._held) { const q = parsePos(p); if (!q || q.fret > N) continue; const m = new THREE.Mesh(this._tipGeo, this._tipMat); this._place(m, q.string, q.fret, 1.2); m.castShadow = true; g.add(m); }
    for (const p of list(this.getAttribute('highlight'))) { const q = parsePos(p); if (!q || q.fret > N) continue; const m = new THREE.Mesh(this._ringGeo, this._ringMat); this._place(m, q.string, q.fret, 0.4); g.add(m); }
    this._invalidate();
  }

  /* ---- sound feedback, keys, motion ---- */
  _say(text, short) {
    if (this._live) this._live.textContent = text;
    if (this._readout) { this._readout.textContent = short; this._readout.classList.add('on'); clearTimeout(this._ro_t); this._ro_t = setTimeout(() => this._readout.classList.remove('on'), 1400); }
  }
  _key(e) {
    const c = this._cursor, N = this._frets(); let moved = true;
    switch (e.key) {
      case 'ArrowUp': c.string = Math.max(1, c.string - 1); break;
      case 'ArrowDown': c.string = Math.min(6, c.string + 1); break;
      case 'ArrowLeft': c.fret = Math.max(0, c.fret - 1); break;
      case 'ArrowRight': c.fret = Math.min(N, c.fret + 1); break;
      case 'Home': c.fret = 0; break;
      case ' ': case 'Enter': e.preventDefault(); this.pluck(c.string, c.fret); return;
      default: moved = false;
    }
    if (!moved) return;
    e.preventDefault(); const midi = noteAt(c.string, c.fret);
    this._say(`String ${c.string}, ${c.fret ? 'fret ' + c.fret : 'open'}, ${spokenName(midi)}`, `${noteName(midi)}  s${c.string} f${c.fret}`);
    this._invalidate();
  }
  _vibrate(string, fret) {
    if (!this._renderer || !this._motion()) return;
    this._vib.set(string, { t0: performance.now(), from: fret ? fretDistance(fret) : 0 }); this._invalidate();
  }
  _invalidate() { if (this._renderer && !this._frame) this._frame = requestAnimationFrame((t) => this._draw(t)); }
  _draw(now) {
    this._frame = 0; if (!this._renderer) return;
    let busy = false; const motion = this._motion();
    // strings: a decaying standing wave between the fretted point and the end of the view
    for (let s = 1; s <= 6; s++) {
      const st = this._strings[s], v = this._vib.get(s), arr = st.mesh.geometry.attributes.position;
      const age = v ? (now - v.t0) / 1000 : Infinity, amp = motion && age < 1.6 ? 1.3 * Math.exp(-age * 3.2) : 0;
      if (!amp && !st.moved) continue;
      const a = arr.array, b = st.base, from = v?.from ?? 0, len = this._model - from, w = Math.cos(age * 2 * Math.PI * (7 + (6 - s) * 0.9));
      for (let i = 0; i < a.length; i += 3) { const u = (b[i] - from) / len; a[i + 1] = b[i + 1] + (amp && u > 0 && u < 1 ? amp * w * Math.sin(Math.PI * u) : 0); a[i + 2] = b[i + 2]; }
      arr.needsUpdate = true; st.moved = !!amp; if (amp) busy = true; else this._vib.delete(s);
    }
    // highlight breath and the keyboard cursor
    const breathe = this.hasAttribute('pulse') && motion && list(this.getAttribute('highlight')).length;
    this._ringMat.opacity = breathe ? 0.72 + 0.28 * Math.cos((now / 1600) * 2 * Math.PI) : 1; if (breathe) busy = true;
    const focused = this.matches(':focus-visible'); this._cursorMesh.visible = focused;
    if (focused) this._place(this._cursorMesh, this._cursor.string, this._cursor.fret, 0.6);
    this._renderer.render(this._scene, this._camera);
    if (busy) this._invalidate();
  }
}

export function defineGuitarNeck(reg = globalThis.customElements) {
  if (!reg) return false;
  if (!reg.get('tk-guitar-neck')) reg.define('tk-guitar-neck', TkGuitarNeck);
  return true;
}
defineGuitarNeck();
export { STANDARD_TUNING, DEFAULT_BINDING, noteAt, noteName, posName, parsePos };
