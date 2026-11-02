/* TokenKit gamepad pack: the input core. No DOM, no rendering: it reads the browser
   Gamepad API (or any object shaped like it) and hands back one plain state per pad.

   Names are positional, not branded: south / east / west / north are the four face
   buttons wherever a maker prints A, Cross or B on them. The order is the W3C
   "standard" mapping (https://w3c.github.io/gamepad/#remapping), which Chrome, Edge,
   Firefox and Safari report for Xbox, PlayStation, Switch Pro, 8BitDo and most
   generic USB or Bluetooth pads. A pad that reports another mapping (mapping === '')
   is never guessed at: its buttons come back as raw b0..bN and axes a0..aN, and the
   picture shows them as a plain list. */

export const STANDARD_BUTTONS = [
  'south', 'east', 'west', 'north',   // 0-3  face buttons
  'lb', 'rb', 'lt', 'rt',             // 4-7  bumpers, triggers (analog .value)
  'view', 'menu',                     // 8-9  the two small centre buttons
  'ls', 'rs',                         // 10-11 stick clicks
  'up', 'down', 'left', 'right',      // 12-15 d-pad
  'home',                             // 16   the centre button
];
export const STANDARD_AXES = ['lx', 'ly', 'rx', 'ry'];

/* Plain words for each control, used by accessible labels and prompt chips. */
export const BUTTON_WORDS = {
  south: 'Bottom face button', east: 'Right face button', west: 'Left face button', north: 'Top face button',
  lb: 'Left bumper', rb: 'Right bumper', lt: 'Left trigger', rt: 'Right trigger',
  view: 'View button', menu: 'Menu button', ls: 'Left stick click', rs: 'Right stick click',
  up: 'D-pad up', down: 'D-pad down', left: 'D-pad left', right: 'D-pad right', home: 'Home button',
  lstick: 'Left stick', rstick: 'Right stick', dpad: 'D-pad',
  fret1: 'Fret 1', fret2: 'Fret 2', fret3: 'Fret 3', fret4: 'Fret 4', fret5: 'Fret 5', strum: 'Strum bar', whammy: 'Whammy bar',
};

/* Glyph sets: what is printed on the four face buttons. Generic on purpose (no
   maker's symbols or colours). Tokens or the glyphs attribute pick one. */
export const GLYPHS = {
  letters: { south: 'A', east: 'B', west: 'X', north: 'Y' },
  numbers: { south: '1', east: '2', west: '3', north: '4' },
  shapes: { south: 'circle', east: 'diamond', west: 'square', north: 'triangle' },
};
export const GLYPH_SETS = Object.keys(GLYPHS);

/* A rough family from the id string, for copy only ("Xbox-style pad connected").
   The mapping, never the family, decides how buttons are read. */
export function padFamily(id = '') {
  const s = String(id).toLowerCase();
  if (/guitar|harmonix|redoctane|riffmaster|rock ?band|guitar hero/.test(s)) return 'guitar';
  if (/8bitdo|2dc8/.test(s)) return '8bitdo';
  if (/xbox|xinput|045e|microsoft/.test(s)) return 'xbox';
  if (/playstation|dualshock|dualsense|054c|sony|wireless controller/.test(s)) return 'playstation';
  if (/nintendo|pro controller|057e|joy-con/.test(s)) return 'nintendo';
  return 'generic';
}

const clampAxis = (v, dead) => { const n = Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0; return Math.abs(n) < dead ? 0 : +n.toFixed(3); };
const btnVal = (b) => {
  if (b == null) return { pressed: false, value: 0 };
  if (typeof b === 'number') return { pressed: b > 0.5, value: Math.max(0, Math.min(1, b)) };
  const value = Number.isFinite(b.value) ? Math.max(0, Math.min(1, b.value)) : (b.pressed ? 1 : 0);
  return { pressed: !!b.pressed || value > 0.5, value: +value.toFixed(3), touched: !!b.touched };
};

/* One Gamepad (or a look-alike) to a plain state. Never throws. */
export function readPad(gp, { deadzone = 0.12 } = {}) {
  if (!gp) return null;
  const buttons = Array.from(gp.buttons || []), axes = Array.from(gp.axes || []);
  const standard = gp.mapping === 'standard';
  const out = { index: gp.index ?? 0, id: String(gp.id || 'Gamepad'), family: padFamily(gp.id), mapping: gp.mapping || '', standard,
    connected: gp.connected !== false, timestamp: gp.timestamp || 0, buttons: {}, axes: {}, raw: { buttons: [], axes: [] } };
  buttons.forEach((b, i) => { out.raw.buttons.push(btnVal(b)); });
  axes.forEach((a, i) => { out.raw.axes.push(clampAxis(a, 0)); });
  if (standard) {
    STANDARD_BUTTONS.forEach((n, i) => { out.buttons[n] = btnVal(buttons[i]); });
    STANDARD_AXES.forEach((n, i) => { out.axes[n] = clampAxis(axes[i], deadzone); });
  } else {
    out.raw.buttons.forEach((b, i) => { out.buttons['b' + i] = b; });
    out.raw.axes.forEach((a, i) => { out.axes['a' + i] = clampAxis(a, deadzone); });
  }
  return out;
}

/* The state a picture draws: pressed names, analog values, stick positions. Also the
   shape a host passes by hand: { pressed: ['south'], lt: 0.4, lx: 0.2, ly: -1 } */
export function toView(s) {
  if (!s) return { pressed: [], values: {}, sticks: { l: [0, 0], r: [0, 0] }, standard: true, raw: null };
  if (Array.isArray(s.pressed)) {
    const values = {}; for (const k of ['lt', 'rt']) if (s[k] != null) values[k] = +s[k];
    return { pressed: s.pressed.slice(), values, sticks: { l: [+s.lx || 0, +s.ly || 0], r: [+s.rx || 0, +s.ry || 0] }, standard: true, raw: null };
  }
  const pressed = Object.keys(s.buttons || {}).filter((k) => s.buttons[k].pressed);
  const values = {}; for (const k of ['lt', 'rt']) if (s.buttons?.[k]) values[k] = s.buttons[k].value;
  return { pressed, values, sticks: { l: [s.axes?.lx || 0, s.axes?.ly || 0], r: [s.axes?.rx || 0, s.axes?.ry || 0] }, standard: !!s.standard,
    raw: s.standard ? null : s.raw, id: s.id, family: s.family, index: s.index };
}

/* The hub: every connected pad by index, connect / disconnect events, one poll per
   frame while anyone listens. Pass `nav` and `win` in tests (a mocked getGamepads). */
export function createGamepadHub({ nav = globalThis.navigator, win = globalThis.window, deadzone = 0.12, raf } = {}) {
  const pads = new Map(), subs = new Set(), evSubs = new Set();
  const frame = raf || (win && win.requestAnimationFrame ? win.requestAnimationFrame.bind(win) : (f) => setTimeout(f, 16));
  /* running: someone is listening. looping: a pad is connected, so read it each frame.
     With no pad there is nothing to read and no frame is asked for; a connect event
     (or a pad already there when listening starts) starts the loop. */
  let running = false, looping = false, onConnect = null, onDisconnect = null;
  const list = () => { try { return Array.from((nav && nav.getGamepads && nav.getGamepads()) || []); } catch { return []; } };
  const emit = (type, pad) => { for (const f of evSubs) { try { f(type, pad); } catch {} } };
  function poll() {
    const seen = new Set();
    for (const gp of list()) {
      if (!gp || gp.connected === false) continue;
      const s = readPad(gp, { deadzone }); seen.add(s.index);
      if (!pads.has(s.index)) { pads.set(s.index, s); emit('connect', s); } else pads.set(s.index, s);
    }
    for (const i of [...pads.keys()]) if (!seen.has(i)) { const s = pads.get(i); pads.delete(i); emit('disconnect', s); }
    for (const f of subs) { try { f(hub.all()); } catch {} }
    return hub.all();
  }
  function loop() { if (!running) { looping = false; return; } poll(); if (pads.size) frame(loop); else looping = false; }
  const wake = () => { if (running && !looping && pads.size) { looping = true; frame(loop); } };
  const hub = {
    supported: !!(nav && typeof nav.getGamepads === 'function'),
    poll,
    all: () => [...pads.values()].sort((a, b) => a.index - b.index),
    get: (i = 0) => pads.get(i) ?? null,
    first: () => hub.all()[0] ?? null,
    subscribe(fn) { subs.add(fn); hub.start(); return () => { subs.delete(fn); if (!subs.size) hub.stop(); }; },
    on(fn) { evSubs.add(fn); return () => evSubs.delete(fn); },
    start() {
      if (running) return; running = true;
      if (win && win.addEventListener) {
        onConnect = (e) => { if (e && e.gamepad) { const s = readPad(e.gamepad, { deadzone }); if (!pads.has(s.index)) { pads.set(s.index, s); emit('connect', s); } wake(); } };
        onDisconnect = (e) => { const i = e?.gamepad?.index; if (i != null && pads.has(i)) { const s = pads.get(i); pads.delete(i); emit('disconnect', s); } };
        win.addEventListener('gamepadconnected', onConnect); win.addEventListener('gamepaddisconnected', onDisconnect);
      }
      poll(); wake();
    },
    stop() { running = false; if (win && win.removeEventListener && onConnect) { win.removeEventListener('gamepadconnected', onConnect); win.removeEventListener('gamepaddisconnected', onDisconnect); } },
  };
  return hub;
}
let shared = null;
export const sharedHub = () => (shared ||= createGamepadHub());
