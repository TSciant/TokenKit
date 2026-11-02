/* TokenKit keyboard pack: the input core. No DOM, no rendering: it listens to keydown /
   keyup on a window (or any object shaped like one) and hands back the keys held, by
   position.

   Keys are named by KeyboardEvent.code, which is positional: "KeyW" is the key where a
   US keyboard prints W, whatever the layout prints there (Z on AZERTY). So WASD stays
   under the left hand on every layout, and the picture never has to guess. The letter
   shown on a cap comes from navigator.keyboard.getLayoutMap() where the browser has it,
   else the US label.

   Privacy: only codes are kept and handed on. The typed character (event.key) is never
   read, stored or sent. Typing in a field is ignored unless the host asks for it. */

/* The main block at ANSI positions: [x, row, width] in key units (1u = one letter key).
   Row 0 is the function row; the half-unit gap below it is real. */
export const MAIN = {
  Escape: [0, 0, 1], F1: [2, 0, 1], F2: [3, 0, 1], F3: [4, 0, 1], F4: [5, 0, 1], F5: [6.5, 0, 1], F6: [7.5, 0, 1], F7: [8.5, 0, 1], F8: [9.5, 0, 1], F9: [11, 0, 1], F10: [12, 0, 1], F11: [13, 0, 1], F12: [14, 0, 1],
  Backquote: [0, 1.5, 1], Digit1: [1, 1.5, 1], Digit2: [2, 1.5, 1], Digit3: [3, 1.5, 1], Digit4: [4, 1.5, 1], Digit5: [5, 1.5, 1], Digit6: [6, 1.5, 1], Digit7: [7, 1.5, 1], Digit8: [8, 1.5, 1], Digit9: [9, 1.5, 1], Digit0: [10, 1.5, 1], Minus: [11, 1.5, 1], Equal: [12, 1.5, 1], Backspace: [13, 1.5, 2],
  Tab: [0, 2.5, 1.5], KeyQ: [1.5, 2.5, 1], KeyW: [2.5, 2.5, 1], KeyE: [3.5, 2.5, 1], KeyR: [4.5, 2.5, 1], KeyT: [5.5, 2.5, 1], KeyY: [6.5, 2.5, 1], KeyU: [7.5, 2.5, 1], KeyI: [8.5, 2.5, 1], KeyO: [9.5, 2.5, 1], KeyP: [10.5, 2.5, 1], BracketLeft: [11.5, 2.5, 1], BracketRight: [12.5, 2.5, 1], Backslash: [13.5, 2.5, 1.5],
  CapsLock: [0, 3.5, 1.75], KeyA: [1.75, 3.5, 1], KeyS: [2.75, 3.5, 1], KeyD: [3.75, 3.5, 1], KeyF: [4.75, 3.5, 1], KeyG: [5.75, 3.5, 1], KeyH: [6.75, 3.5, 1], KeyJ: [7.75, 3.5, 1], KeyK: [8.75, 3.5, 1], KeyL: [9.75, 3.5, 1], Semicolon: [10.75, 3.5, 1], Quote: [11.75, 3.5, 1], Enter: [12.75, 3.5, 2.25],
  ShiftLeft: [0, 4.5, 2.25], KeyZ: [2.25, 4.5, 1], KeyX: [3.25, 4.5, 1], KeyC: [4.25, 4.5, 1], KeyV: [5.25, 4.5, 1], KeyB: [6.25, 4.5, 1], KeyN: [7.25, 4.5, 1], KeyM: [8.25, 4.5, 1], Comma: [9.25, 4.5, 1], Period: [10.25, 4.5, 1], Slash: [11.25, 4.5, 1], ShiftRight: [12.25, 4.5, 2.75],
  ControlLeft: [0, 5.5, 1.25], MetaLeft: [1.25, 5.5, 1.25], AltLeft: [2.5, 5.5, 1.25], Space: [3.75, 5.5, 6.25], AltRight: [10, 5.5, 1.25], MetaRight: [11.25, 5.5, 1.25], ContextMenu: [12.5, 5.5, 1.25], ControlRight: [13.75, 5.5, 1.25],
};
/* The inverted T, drawn as its own group to the right of the main block. */
export const ARROWS = { ArrowUp: [1, 0, 1], ArrowLeft: [0, 1, 1], ArrowDown: [1, 1, 1], ArrowRight: [2, 1, 1] };

/* What a US keyboard prints on each cap. Arrows are drawn, not printed. */
const PRINTED = { Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/' };
const NAMED = {
  Escape: ['Esc', 'Esc'], Backspace: ['Backspace', 'Backspace'], Tab: ['Tab', 'Tab'], CapsLock: ['Caps', 'Caps Lock'], Enter: ['Enter', 'Enter'],
  ShiftLeft: ['Shift', 'Left Shift'], ShiftRight: ['Shift', 'Right Shift'], ControlLeft: ['Ctrl', 'Left Ctrl'], ControlRight: ['Ctrl', 'Right Ctrl'],
  AltLeft: ['Alt', 'Left Alt'], AltRight: ['Alt', 'Right Alt'], MetaLeft: ['Meta', 'Left Meta'], MetaRight: ['Meta', 'Right Meta'], ContextMenu: ['Menu', 'Menu key'],
  Space: ['Space', 'Space bar'], ArrowUp: ['', 'Up arrow'], ArrowDown: ['', 'Down arrow'], ArrowLeft: ['', 'Left arrow'], ArrowRight: ['', 'Right arrow'],
};
const PUNCT_WORDS = { Backquote: 'Backtick', Minus: 'Minus', Equal: 'Equals', BracketLeft: 'Left bracket', BracketRight: 'Right bracket', Backslash: 'Backslash', Semicolon: 'Semicolon', Quote: 'Quote', Comma: 'Comma', Period: 'Period', Slash: 'Slash' };

/* The keys whose cap shows a character, so a layout map may relabel them. */
export const printable = (code) => /^(Key[A-Z]|Digit[0-9])$/.test(code) || code in PRINTED;

/* The US label printed on a cap: "W", "1", "Shift", "Space"; "" for arrows. */
export function usLabel(code) {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-2])$/.test(code)) return code;
  if (code in PRINTED) return PRINTED[code];
  return NAMED[code]?.[0] ?? code;
}

/* The cap's label for this layout: the layout map's character for a printable key
   (a letter key's upper-cased, as caps print it), else the US label. `labels` is a Map or plain object, code -> key. */
export function capLabel(code, labels) {
  if (labels && printable(code)) {
    const v = typeof labels.get === 'function' ? labels.get(code) : labels[code];
    if (typeof v === 'string' && v.length && v.length <= 2) return /^Key[A-Z]$/.test(code) ? v.toUpperCase() : v;
  }
  return usLabel(code);
}

/* Plain words for a key, used by accessible names and prompt chips: "W key",
   "Space bar", "Left Shift", "Up arrow". Follows the layout's letter when given one. */
export function keyWord(code, labels) {
  if (NAMED[code]) return NAMED[code][1];
  if (/^F([1-9]|1[0-2])$/.test(code)) return code;
  const l = capLabel(code, labels);
  if (code in PRINTED && l === PRINTED[code]) return PUNCT_WORDS[code] + ' key';
  return `${l} key`;
}

/* Named clusters for the `keys` attribute. Anything else in the list is read as a
   single KeyboardEvent.code (KeyF, KeyR, Digit5, F9...). */
export const CLUSTERS = {
  wasd: ['KeyQ', 'KeyW', 'KeyE', 'KeyA', 'KeyS', 'KeyD'],
  arrows: ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'],
  space: ['Space'],
  shift: ['ShiftLeft'],
  ctrl: ['ControlLeft'],
  alt: ['AltLeft'],
  tab: ['Tab'],
  esc: ['Escape'],
  enter: ['Enter'],
  numbers: ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
  numbers9: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'],
  fkeys: ['F1', 'F2', 'F3', 'F4'],
};
export const DEFAULT_KEYS = 'wasd arrows space shift';
export const KNOWN_CODES = [...Object.keys(MAIN), ...Object.keys(ARROWS)];

const list = (v) => (Array.isArray(v) ? v : String(v ?? '').split(/[\s,]+/)).filter(Boolean);

/* "wasd arrows KeyF" -> ['KeyQ','KeyW',...,'ArrowRight','KeyF']: clusters expanded,
   duplicates dropped, codes the picture can't draw left out. */
export function parseKeys(v = DEFAULT_KEYS) {
  const out = [];
  for (const t of list(v)) {
    const codes = CLUSTERS[t.toLowerCase()] ?? [t];
    for (const c of codes) if ((c in MAIN || c in ARROWS) && !out.includes(c)) out.push(c);
  }
  return out;
}

/* The state a picture draws: the codes held. Also the shape a host passes by hand:
   { pressed: ['KeyW', 'ShiftLeft'] } (or a plain array). */
export function toView(s) {
  const pressed = Array.isArray(s) ? s : Array.isArray(s?.pressed) ? s.pressed : Array.isArray(s?.keys) ? s.keys : [];
  return { pressed: pressed.filter((c) => typeof c === 'string' && c) };
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
/* Is this event aimed at something the reader is typing in? Reads the composed path,
   so a field inside a shadow root counts too. */
export function isEditableTarget(e) {
  const path = typeof e?.composedPath === 'function' ? e.composedPath() : [e?.target];
  for (const n of path) {
    if (!n || typeof n !== 'object') continue;
    if (n.isContentEditable) return true;
    if (typeof n.tagName === 'string' && EDITABLE_TAGS.has(n.tagName.toUpperCase())) return true;
    const ce = typeof n.getAttribute === 'function' ? n.getAttribute('contenteditable') : null;
    if (ce != null && ce !== 'false') return true;
  }
  return false;
}

const MODIFIERS = new Set(['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']);

/* The hub: the keys held, press / release events, nothing stuck. Listeners go on when
   someone subscribes and come off when the last one leaves. Pass `win` and `doc` in
   tests (mocked event targets).

     capture: also read keys while focus is in an input, textarea, select or
              contenteditable (off by default: typing a name is not playing). */
export function createKeyboardHub({ win = globalThis.window, doc = globalThis.document, capture = false } = {}) {
  const held = new Set(), subs = new Set(), evSubs = new Set();
  let running = false, L = null;
  const emit = (type, detail) => { for (const f of evSubs) { try { f(type, detail); } catch {} } };
  const notify = () => { const all = hub.held(); for (const f of subs) { try { f(all); } catch {} } };
  const release = (code, reason) => { if (!held.delete(code)) return false; emit('up', { code, held: hub.held(), reason }); return true; };
  function clear(reason = 'clear') { let any = false; for (const c of [...held]) any = release(c, reason) || any; if (any) notify(); }
  function onDown(e) {
    if (!e || e.isComposing || e.keyCode === 229) return;          // an IME is composing: not a key press
    const code = e.code; if (typeof code !== 'string' || !code || code === 'Unidentified') return;
    if (!capture && isEditableTarget(e)) return;
    if (held.has(code)) return;                                      // auto-repeat: already held
    held.add(code); emit('down', { code, held: hub.held(), repeat: !!e.repeat }); notify();
  }
  function onUp(e) {
    const code = e?.code; if (typeof code !== 'string' || !code) return;
    // A release always counts, wherever focus is, so a key pressed before focus moved
    // into a field can't stay down.
    let changed = release(code, 'release');
    // macOS sends no keyup for keys released while Meta is down: let go of them with it.
    if (code === 'MetaLeft' || code === 'MetaRight') for (const c of [...held]) if (!MODIFIERS.has(c)) changed = release(c, 'meta') || changed;
    if (changed) notify();
  }
  const onBlur = () => clear('blur');
  const onVis = () => { if (doc && doc.visibilityState === 'hidden') clear('hidden'); };
  const hub = {
    supported: !!(win && typeof win.addEventListener === 'function'),
    capture,
    held: () => [...held],
    isHeld: (code) => held.has(code),
    clear,
    subscribe(fn) { subs.add(fn); hub.start(); return () => { subs.delete(fn); if (!subs.size && !evSubs.size) hub.stop(); }; },
    on(fn) { evSubs.add(fn); return () => { evSubs.delete(fn); if (!subs.size && !evSubs.size) hub.stop(); }; },
    start() {
      if (running || !hub.supported) return; running = true;
      L = { keydown: onDown, keyup: onUp, blur: onBlur };
      for (const [t, f] of Object.entries(L)) win.addEventListener(t, f);
      doc?.addEventListener?.('visibilitychange', onVis);
    },
    stop() {
      if (!running) return; running = false;
      for (const [t, f] of Object.entries(L)) win.removeEventListener(t, f);
      doc?.removeEventListener?.('visibilitychange', onVis);
      L = null; held.clear();
    },
  };
  return hub;
}

/* The layout's own characters, by code, where the browser offers them
   (navigator.keyboard.getLayoutMap(): Chromium, secure contexts). Resolves to a Map, or
   null where it's missing or refused (an iframe, Firefox, Safari). Asked once. */
let LAYOUT = null;
export function layoutLabels(nav = globalThis.navigator) {
  if (nav !== globalThis.navigator) return readLayout(nav);
  return (LAYOUT ||= readLayout(nav));
}
async function readLayout(nav) {
  try { const m = await nav?.keyboard?.getLayoutMap?.(); return m && typeof m.get === 'function' ? m : null; } catch { return null; }
}
