/* TokenKit instruments pack: <tk-piano-keys>, a playable 3D piano keyboard.
   Modelled in three.js at true proportions: 23.5 mm white keys notched round 13.7 mm black
   keys that stand 12.7 mm proud, the black keys spaced as a real keyboard spaces them (not
   centred on the gaps), keys that dip about 10 mm on their pivots, cheek blocks, a red felt
   strip and a gloss fallboard. Every key is bound to its note; with `sound`, playing it
   sounds a real recording (piano-tone.mjs). Without `sound` it fetches nothing.

     <tk-piano-keys keys="25" sound highlight="C4 E4 G4" label="C major"></tk-piano-keys>
     el.state = { pressed: ['C4', 'E4'] }          // keys held down (struck on the way down)
     el.state = { pressed: ['west', 'rt'] }        // gamepad buttons, through el.binding
     el.play(['C4', 'E4', 'G4'], { duration: 1 })  // also by tap, drag (glissando) or keys
     el.addEventListener('tk-piano-note', (e) => e.detail)   // { midi, name, frequency, velocity }

   `keys` picks a standard size (25, 37, 49, 61, 76, 88); `range="F3-F5"` any other, white
   key to white key. Keys: Left/Right move a key, Up/Down an octave, Home/End the ends,
   Space or Enter plays (held, it holds the key). Motion (keys easing down and up, the
   highlight's breath) is off under prefers-reduced-motion, `calm` and the kit's motion
   pause; keys still go down, they just do not travel. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { WHITE_W, WHITE_L, BLACK_W, BLACK_L, BLACK_H, DEFAULT_BINDING, DAMPER, isBlack, keyX, parseRange, heldBy, noteName, spokenName, frequency, parseNote, createPianoSampler } from './piano-tone.mjs';

const HTMLBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(/[\s,]+/)).filter(Boolean);

/* Theme defaults, as the other gamepad elements use; any --tk-gamepad-* property wins. */
const THEME = {
  boosty: { accent: '#22e4f0', down: '#ff3fb4', label: '#efe9ff' },
  dark: { accent: '#7fb2ff', down: '#f2c14e', label: '#eef0f4' },
  light: { accent: '#2f6fe0', down: '#2f6fe0', label: '#1d2026' },
};

/* Action and cabinet, in millimetres. z runs toward the player (key fronts at z = 0). */
const GAP = 0.55, BEVEL = 0.9, WHITE_T = 18, PIVOT_Z = -WHITE_L - 200, DIP = 10, CHEEK = 24, EL = THREE.MathUtils.degToRad(52);
const WHITE_DIP = Math.atan(DIP / -PIVOT_Z), BLACK_DIP = Math.atan(DIP * 0.9 / (-PIVOT_Z - (WHITE_L - BLACK_L)));

function whiteKeyGeometry(m, lo, hi) {
  const c = keyX(m), L = c - WHITE_W / 2 + GAP + BEVEL, R = c + WHITE_W / 2 - GAP - BEVEL, HEAD = WHITE_L - BLACK_L - 1.2;
  const bl = isBlack(m - 1) && m - 1 >= lo ? keyX(m - 1) + BLACK_W / 2 + GAP + 0.6 + BEVEL : L;
  const br = isBlack(m + 1) && m + 1 <= hi ? keyX(m + 1) - BLACK_W / 2 - GAP - 0.6 - BEVEL : R;
  const s = new THREE.Shape();
  s.moveTo(L, BEVEL); s.lineTo(R, BEVEL); s.lineTo(R, HEAD); s.lineTo(br, HEAD); s.lineTo(br, WHITE_L - BEVEL);
  s.lineTo(bl, WHITE_L - BEVEL); s.lineTo(bl, HEAD); s.lineTo(L, HEAD); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: WHITE_T, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 3, curveSegments: 4 });
  g.rotateX(-Math.PI / 2); g.translate(-c, -(WHITE_T + BEVEL), 0); // shape y -> -z (back), extrusion -> up; top at y = 0, centred on its own x
  return g;
}
function blackKeyGeometry() {
  const H = BLACK_H + 16, g = new RoundedBoxGeometry(BLACK_W, H, BLACK_L, 3, 1.4);
  g.translate(0, BLACK_H - H / 2, -WHITE_L + BLACK_L / 2);
  // taper above the white keys: narrower on top, the front sloping back
  const p = g.attributes.position, front = -WHITE_L + BLACK_L;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i); if (y <= 0) continue; const t = y / BLACK_H;
    p.setX(i, p.getX(i) * (1 - 0.24 * t));
    const z = p.getZ(i); if (z > front - 20) p.setZ(i, z - 7 * t * ((z - (front - 20)) / 20));
  }
  g.computeVertexNormals(); return g;
}

const CSS = `
:host{display:block;position:relative;width:var(--tk-piano-keys-width,100%);max-width:100%;outline:none;border-radius:10px;-webkit-tap-highlight-color:transparent;touch-action:none;user-select:none}
:host([hidden]){display:none}
:host(:focus-visible){box-shadow:0 0 0 3px var(--tk-gamepad-accent,var(--_accent,#22e4f0))}
.stage{position:relative;width:100%;aspect-ratio:var(--tk-piano-keys-aspect,var(--_aspect,2.4))}
canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;cursor:pointer}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.fallback{position:absolute;inset:0;display:grid;place-items:center;font:600 13px/1.4 var(--tk-font-sans,system-ui,sans-serif);color:var(--tk-gamepad-label,#efe9ff);opacity:.8;text-align:center;padding:12px}
.readout{position:absolute;right:10px;top:8px;font:700 13px/1 var(--tk-font-sans,system-ui,sans-serif);letter-spacing:.02em;color:var(--tk-gamepad-label,var(--_label,#efe9ff));opacity:0;transition:opacity .25s ease;pointer-events:none;text-shadow:0 1px 2px #0008}
.readout.on{opacity:.9}
:host([calm]) .readout{transition:none}
@media (prefers-reduced-motion:reduce){.readout{transition:none}}
`;

export class TkPianoKeys extends HTMLBase {
  static get observedAttributes() { return ['keys', 'range', 'highlight', 'pulse', 'calm', 'theme', 'label', 'size', 'sound']; }
  constructor() {
    super();
    this._binding = { ...DEFAULT_BINDING }; this._pressedRaw = new Set();
    this._by = new Map(); this._sustain = false; this._ringing = new Set(); this._strikes = new Map();
    this._cursor = 60; this._frame = 0;
    if (!this.attachShadow) return;
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = `<style>${CSS}</style><div class="stage"></div><div class="readout" aria-hidden="true"></div><div class="sr" aria-live="polite"></div>`;
    this._stage = this._root.querySelector('.stage'); this._live = this._root.querySelector('.sr'); this._readout = this._root.querySelector('.readout');
  }
  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.setAttribute('role', 'application'); this.setAttribute('aria-roledescription', 'piano keyboard');
    this._label(); this._sizeHost(); this._build();
    this._onKey = (e) => this._key(e, true); this._onKeyUp = (e) => this._key(e, false);
    this.addEventListener('keydown', this._onKey); this.addEventListener('keyup', this._onKeyUp);
    this._onFocus = () => this._invalidate(); this._onBlur = () => { this._releaseAll('key'); this._invalidate(); };
    this.addEventListener('focus', this._onFocus); this.addEventListener('blur', this._onBlur);
    this._mq = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    this._mo = typeof MutationObserver === 'function' ? new MutationObserver(() => this._invalidate()) : null;
    this._mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  }
  disconnectedCallback() {
    this.removeEventListener('keydown', this._onKey); this.removeEventListener('keyup', this._onKeyUp);
    this.removeEventListener('focus', this._onFocus); this.removeEventListener('blur', this._onBlur);
    this._mo?.disconnect(); this._teardown(); this._sampler?.stop(); this._by.clear(); this._ringing.clear();
  }
  attributeChangedCallback(n, o, v) {
    if (o === v || !this.isConnected) return;
    if (n === 'keys' || n === 'range') { this._teardown(); this._build(); }
    else if (n === 'label') this._label();
    else if (n === 'size') this._sizeHost();
    else if (n === 'sound') { if (v != null) this._ensureSampler(); }
    else { this._applyTheme(); this._applyMarkers(); }
  }

  /* ---- public ---- */
  /** { pressed: [...] }: note names ("C4") and/or gamepad buttons read through `binding`. */
  set state(s) {
    this._pressedRaw = new Set(list(s?.pressed));
    const { notes, sustain } = heldBy([...this._pressedRaw], this._binding);
    for (const [m, by] of this._by) if (by.has('state') && !notes.has(m)) this._up(m, 'state');
    for (const m of notes) this._down(m, 'state');
    this.sustain = sustain;
  }
  get state() { return { pressed: [...this._pressedRaw] }; }
  /** Gamepad button -> note name (or 'sustain'), e.g. { south: 'D4', rt: 'sustain' }. */
  set binding(b) { this._binding = { ...(b || DEFAULT_BINDING) }; this.state = { pressed: [...this._pressedRaw] }; }
  get binding() { return { ...this._binding }; }
  /** The sustain pedal: while it is down, keys let go keep ringing. */
  set sustain(on) {
    on = !!on; if (on === this._sustain) return; this._sustain = on;
    if (!on) for (const m of [...this._ringing]) if (!this._by.get(m)?.size) this._damp(m);
  }
  get sustain() { return this._sustain; }
  /** Hold a key down (it sounds as it goes down). Returns the note's detail, or null if it is off this keyboard. */
  press(note, { velocity = 0.8 } = {}) { const m = this._midi(note); return m == null ? null : this._down(m, 'api', velocity); }
  /** Let a key go. */
  release(note) { const m = this._midi(note); if (m != null) this._up(m, 'api'); }
  /** Press and let go: one note or a chord, for `duration` seconds. */
  play(notes, { duration = 0.6, velocity = 0.8 } = {}) {
    const ms = (Array.isArray(notes) ? notes : [notes]).map((n) => this._midi(n)).filter((m) => m != null);
    const out = ms.map((m) => this._down(m, 'play', velocity)).filter(Boolean);
    setTimeout(() => { for (const m of ms) this._up(m, 'play'); }, duration * 1000);
    return out;
  }
  /** Keys held down right now, as note names. */
  get down() { return [...this._by].filter(([, s]) => s.size).map(([m]) => noteName(m)); }
  /** Fetch the recordings now rather than on the first note (needs `sound`). */
  loadSound() { return this._ensureSampler()?.load() ?? Promise.resolve(false); }
  /** The 3D scene, for a page that wants to restyle it. */
  get scene() { return this._scene || null; }

  /* ---- notes ---- */
  _range() { return parseRange(this.getAttribute('keys'), this.getAttribute('range')); }
  _midi(n) { const m = typeof n === 'number' ? n : parseNote(n); const [lo, hi] = this._range(); return m != null && m >= lo && m <= hi ? m : null; }
  _detail(m, velocity) { return { midi: m, name: noteName(m), frequency: frequency(m), ...(velocity != null && { velocity }) }; }
  _down(m, src, velocity = 0.8) {
    const [lo, hi] = this._range(); if (m < lo || m > hi) return null;
    let by = this._by.get(m); if (!by) this._by.set(m, (by = new Set()));
    const fresh = !by.size; by.add(src); if (!fresh) return null;
    if (this.hasAttribute('sound')) {
      const s = this._ensureSampler(), strike = s.play(m, { velocity }).catch(() => null);
      this._strikes.set(m, strike);
    }
    this._ringing.add(m); this._move(m);
    this._say(spokenName(m), noteName(m));
    const detail = this._detail(m, velocity);
    this.dispatchEvent(new CustomEvent('tk-piano-note', { detail, bubbles: true, composed: true }));
    return detail;
  }
  _up(m, src) {
    const by = this._by.get(m); if (!by?.delete(src) || by.size) return;
    this._move(m);
    if (!this._sustain) this._damp(m);
    this.dispatchEvent(new CustomEvent('tk-piano-release', { detail: this._detail(m), bubbles: true, composed: true }));
  }
  _damp(m) {
    this._ringing.delete(m);
    const strike = this._strikes.get(m); if (!strike) return; this._strikes.delete(m);
    // the recording may still be loading: damp it once it starts, unless the key was struck again
    strike.then((v) => { if (!this._strikes.has(m)) v?.stop(undefined, DAMPER); });
  }
  _releaseAll(src) { for (const [m, by] of this._by) if (by.has(src)) this._up(m, src); }

  /* ---- build ---- */
  _label() {
    const name = this.getAttribute('label') || 'Piano keyboard';
    this.setAttribute('aria-label', `${name}. Left and Right move a key, Up and Down an octave, Space plays.`);
  }
  _sizeHost() { const s = this.getAttribute('size'); this.style.setProperty('--tk-piano-keys-width', s ? (/[a-z%]$/.test(s) ? s : Math.round(+s * 640) + 'px') : ''); }
  _ensureSampler() { return (this._sampler ||= createPianoSampler()); }
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
    catch { this._stage.innerHTML = `<div class="fallback">This piano needs WebGL, which this browser has turned off.</div>`; return; }
    this._renderer = renderer;
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._stage.appendChild(renderer.domElement);

    const [lo, hi] = this._range(), mid = (keyX(lo) + keyX(hi)) / 2;
    const left = keyX(lo) - WHITE_W / 2 - mid, right = keyX(hi) + WHITE_W / 2 - mid, W = right - left;
    this._cursor = Math.min(hi, Math.max(lo, this._cursor));
    const scene = (this._scene = new THREE.Scene());
    const pm = new THREE.PMREMGenerator(renderer); this._env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    scene.environment = this._env;
    const key = new THREE.DirectionalLight(0xfff3e4, 2.2); key.position.set(-W * 0.25, 420, -60); key.target.position.set(0, 0, -60);
    key.castShadow = true; key.shadow.mapSize.set(4096, 1024); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.03;
    Object.assign(key.shadow.camera, { left: -W * 0.75, right: W * 0.75, top: 160, bottom: -160, near: 200, far: 700 });
    scene.add(key, key.target, new THREE.HemisphereLight(0xeef2ff, 0x1a1410, 0.6));

    const ivory = new THREE.MeshPhysicalMaterial({ color: 0xf4f0e8, roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.3 });
    const ebony = new THREE.MeshPhysicalMaterial({ color: 0x0c0b0b, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 });
    const gloss = new THREE.MeshPhysicalMaterial({ color: 0x080707, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });
    const felt = new THREE.MeshStandardMaterial({ color: 0x7c1422, roughness: 1 });
    const bed = new THREE.MeshStandardMaterial({ color: 0x15100c, roughness: 0.9 });
    this._mats = [ivory, ebony, gloss, felt, bed];
    const add = (geo, mat, { cast = false, receive = false, parent = scene } = {}) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; parent.add(m); return m; };

    // keys: each on its own pivot far back in the action, as a real key is
    this._keys = new Map(); const blackGeo = blackKeyGeometry(); this._geos = [blackGeo];
    for (let m = lo; m <= hi; m++) {
      const black = isBlack(m), pivot = new THREE.Group(); pivot.position.set(keyX(m) - mid, -6, PIVOT_Z); scene.add(pivot);
      const holder = new THREE.Group(); holder.position.set(0, 6, -PIVOT_Z); pivot.add(holder);
      const mat = (black ? ebony : ivory).clone(); this._mats.push(mat);
      const geo = black ? blackGeo : whiteKeyGeometry(m, lo, hi); if (!black) this._geos.push(geo);
      const mesh = add(geo, mat, { cast: true, receive: true, parent: holder }); mesh.userData.midi = m;
      this._keys.set(m, { pivot, holder, mesh, mat, black, angle: 0 });
    }
    // cabinet: key bed, the rail in front, felt along the back, cheek blocks and a fallboard
    const box = (w, h, d, x, y, z, mat, o = {}) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); this._geos.push(g); return add(g, mat, o); };
    const rbox = (w, h, d, r, x, y, z, mat, o = {}) => { const g = new RoundedBoxGeometry(w, h, d, 3, r); g.translate(x, y, z); this._geos.push(g); return add(g, mat, o); };
    box(W + 2, 4, WHITE_L + 12, 0, -WHITE_T - 6, -WHITE_L / 2 - 4, bed, { receive: true });
    rbox(W + 2 * CHEEK, 22, 14, 2, 0, -WHITE_T - 15, 8, gloss, { receive: true });
    box(W + 2, 9, 7, 0, -1.5, -WHITE_L - 4.5, felt, { receive: true });
    for (const x of [left - CHEEK / 2, right + CHEEK / 2]) rbox(CHEEK - 1, 44, WHITE_L + 34, 3, x, -WHITE_T + 2, -WHITE_L / 2 - 2, gloss, { cast: true, receive: true });
    const fall = rbox(W + 2 * CHEEK, 70, 16, 3, 0, 22, -WHITE_L - 20, gloss, { receive: true }); fall.rotation.x = -0.12;

    // markers: dots on the keys to play (highlight), a ring on the keyboard cursor
    this._dotGeo = new THREE.CircleGeometry(4.6, 32); this._dotGeo.rotateX(-Math.PI / 2);
    this._ringGeo = new THREE.RingGeometry(5.2, 6.6, 40); this._ringGeo.rotateX(-Math.PI / 2);
    this._dotMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, toneMapped: false, depthWrite: false });
    this._cursorMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, toneMapped: false, depthWrite: false });
    this._cursorMesh = new THREE.Mesh(this._ringGeo, this._cursorMat); this._cursorMesh.renderOrder = 2;
    this._dots = [];

    // camera: where a player sits, looking down over the keys toward the fallboard
    const cam = (this._camera = new THREE.PerspectiveCamera(24, 3, 10, 6000));
    const spanX = W + 2 * CHEEK + 8, near = 22, far = -WHITE_L - 40, depth = (near - far) * Math.sin(EL) + 70 * Math.cos(EL);
    this.style.setProperty('--_aspect', String(Math.max(1.6, Math.min(9, spanX / depth)).toFixed(3)));
    const look = new THREE.Vector3(0, 0, (near + far) / 2 + 6);
    this._fit = () => {
      const w = this._stage.clientWidth || 640, h = this._stage.clientHeight || 260; cam.aspect = w / h;
      const vf = THREE.MathUtils.degToRad(cam.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
      const dist = Math.max((spanX / 2) / Math.tan(hf / 2), (depth / 2) / Math.tan(vf / 2)) * 1.04;
      cam.position.set(0, look.y + dist * Math.sin(EL), look.z + dist * Math.cos(EL)); cam.lookAt(look); cam.updateProjectionMatrix();
      renderer.setSize(w, h, false); this._invalidate();
    };
    this._ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._fit()) : null; this._ro?.observe(this._stage);
    this._fit();

    // pointer: tap to play, hold to hold, drag for a glissando; each finger its own key
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), meshes = [...this._keys.values()].map((k) => k.mesh);
    const at = (e) => {
      const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam); const hit = ray.intersectObjects(meshes, false)[0];
      return hit ? hit.object.userData.midi : null;
    };
    const fingers = new Map();
    this._onDown = (e) => {
      const m = at(e); if (m == null) return; e.preventDefault(); this.focus({ preventScroll: true });
      renderer.domElement.setPointerCapture?.(e.pointerId); fingers.set(e.pointerId, m); this._cursor = m; this._down(m, 'p' + e.pointerId);
    };
    this._onMove = (e) => {
      if (!fingers.has(e.pointerId)) return; const m = at(e), was = fingers.get(e.pointerId); if (m == null || m === was) return;
      fingers.set(e.pointerId, m); this._up(was, 'p' + e.pointerId); this._cursor = m; this._down(m, 'p' + e.pointerId, 0.65);
    };
    this._onUp = (e) => { const m = fingers.get(e.pointerId); if (m == null) return; fingers.delete(e.pointerId); this._up(m, 'p' + e.pointerId); };
    renderer.domElement.addEventListener('pointerdown', this._onDown); renderer.domElement.addEventListener('pointermove', this._onMove);
    renderer.domElement.addEventListener('pointerup', this._onUp); renderer.domElement.addEventListener('pointercancel', this._onUp);

    this._applyTheme(); this._applyMarkers(); for (const m of this._keys.keys()) this._move(m);
  }
  _teardown() {
    cancelAnimationFrame(this._frame); this._frame = 0; this._ro?.disconnect(); this._ro = null;
    if (!this._renderer) return;
    for (const g of [...this._geos, this._dotGeo, this._ringGeo]) g.dispose();
    for (const m of [...this._mats, this._dotMat, this._cursorMat]) m.dispose();
    this._env?.dispose(); this._renderer.dispose(); this._renderer.domElement.remove();
    this._renderer = this._scene = this._camera = this._keys = null;
  }

  /* ---- markers, theme, keys going down ---- */
  _applyTheme() {
    if (!this._renderer) return; const c = this._colors();
    this._down_c = new THREE.Color(c.down); this._dotMat.color.set(c.accent); this._cursorMat.color.set(c.accent);
    for (const m of this._keys.keys()) this._tint(m); this._invalidate();
  }
  _onKeyTop(mesh, m) { const k = this._keys.get(m); mesh.position.set(0, (k.black ? BLACK_H : 0) + 0.25, k.black ? -WHITE_L + BLACK_L - 16 : -24); k.holder.add(mesh); }
  _applyMarkers() {
    if (!this._renderer) return;
    for (const d of this._dots) d.removeFromParent(); this._dots = [];
    for (const n of list(this.getAttribute('highlight'))) {
      const m = this._midi(n); if (m == null) continue;
      const d = new THREE.Mesh(this._dotGeo, this._dotMat); d.renderOrder = 1; if (isBlack(m)) d.scale.setScalar(0.72); this._onKeyTop(d, m); this._dots.push(d);
    }
    this._invalidate();
  }
  _tint(m) {
    // a held key takes the down colour: ivory is already bright, so it is tinted, not lit
    const k = this._keys?.get(m); if (!k) return; const on = !!this._by.get(m)?.size;
    k.base ||= k.mat.color.clone();
    k.mat.color.copy(k.base); if (on) k.mat.color.lerp(this._down_c, k.black ? 0.75 : 0.8);
    k.mat.emissive.copy(on ? this._down_c : new THREE.Color(0)); k.mat.emissiveIntensity = on ? (k.black ? 0.4 : 0.08) : 0;
  }
  _move(m) {
    const k = this._keys?.get(m); if (!k) return;
    k.target = this._by.get(m)?.size ? (k.black ? BLACK_DIP : WHITE_DIP) : 0;
    this._tint(m); this._invalidate();
  }

  /* ---- feedback, keys, drawing ---- */
  _say(text, short) {
    if (this._live) this._live.textContent = text;
    if (this._readout) { this._readout.textContent = short; this._readout.classList.add('on'); clearTimeout(this._rt); this._rt = setTimeout(() => this._readout.classList.remove('on'), 1400); }
  }
  _key(e, isDown) {
    const [lo, hi] = this._range();
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (isDown && !e.repeat) this._down(this._cursor, 'key'); else if (!isDown) this._up(this._cursor, 'key'); return; }
    if (!isDown) return;
    const was = this._cursor; let c = was;
    switch (e.key) {
      case 'ArrowLeft': c--; break; case 'ArrowRight': c++; break;
      case 'ArrowDown': c -= 12; break; case 'ArrowUp': c += 12; break;
      case 'Home': c = lo; break; case 'End': c = hi; break;
      default: return;
    }
    e.preventDefault(); c = Math.max(lo, Math.min(hi, c));
    if (this._by.get(was)?.has('key')) { this._up(was, 'key'); if (c !== was) this._down(c, 'key'); }
    this._cursor = c; this._say(spokenName(c), noteName(c)); this._invalidate();
  }
  _invalidate() { if (this._renderer && !this._frame) this._frame = requestAnimationFrame((t) => this._draw(t)); }
  _draw(now) {
    this._frame = 0; if (!this._renderer) return;
    let busy = false; const motion = this._motion(), dt = Math.min(0.05, (now - (this._last || now)) / 1000); this._last = now;
    // keys travel down fast (a strike) and come back a little slower (the key's spring)
    for (const k of this._keys.values()) {
      const t = k.target || 0; if (k.angle === t) continue;
      if (!motion) k.angle = t;
      else { const rate = (t > k.angle ? 1 / 0.035 : 1 / 0.09) * Math.max(BLACK_DIP, WHITE_DIP); k.angle = t > k.angle ? Math.min(t, k.angle + rate * dt) : Math.max(t, k.angle - rate * dt); }
      k.pivot.rotation.x = k.angle; if (k.angle !== t) busy = true;
    }
    const breathe = this.hasAttribute('pulse') && motion && this._dots.length;
    this._dotMat.opacity = breathe ? 0.65 + 0.35 * Math.cos((now / 1600) * 2 * Math.PI) : 1; if (breathe) busy = true;
    const focused = this.matches(':focus-visible');
    if (focused && this._keys.has(this._cursor)) { this._onKeyTop(this._cursorMesh, this._cursor); this._cursorMesh.scale.setScalar(isBlack(this._cursor) ? 0.72 : 1); this._cursorMesh.visible = true; }
    else this._cursorMesh.visible = false;
    this._renderer.render(this._scene, this._camera);
    if (busy) this._invalidate(); else this._last = 0;
  }
}

export function definePianoKeys(reg = globalThis.customElements) {
  if (!reg) return false;
  if (!reg.get('tk-piano-keys')) reg.define('tk-piano-keys', TkPianoKeys);
  return true;
}
definePianoKeys();
export { DEFAULT_BINDING, noteName, parseNote, isBlack, keyX };
