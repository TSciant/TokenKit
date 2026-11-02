/* TokenKit TV pack: the remote contract. No DOM, no rendering: it turns whatever the
   reader is holding into five verbs, and hands them on.

     move(up | down | left | right)   select   back   home   menu

   Sources, all optional:
     keys      keydown on a target (the shell, or a window): the arrow keys, Enter and
               Space, Backspace and Escape, and the browser and TV-remote keys below.
               Keys are read by KeyboardEvent.code, as the keyboard pack names them.
     keyboard  a keyboard pack hub (createKeyboardHub): its press events, by code.
     pad       a gamepad pack hub (createGamepadHub / sharedHub): the D-pad, the left
               stick, A (south) and B (east), Menu and Home, by the standard mapping's
               positional names. A pad with another mapping is never guessed at.

   The input cores are the packs' own: fields are recognised by the keyboard pack's
   isEditableTarget, pads are read by the gamepad pack's hub. Keys pressed while focus
   is in a text field are ignored, unless `capture` is set.

   Privacy: the typed character (event.key) is never read for a key that has a code.
   Some TV browsers send their remote's Back, Home and Menu buttons with no code; for
   those only, event.key is compared against a fixed list of key names (never a
   character), and nothing is kept or sent anywhere. */
import { isEditableTarget } from '../keyboard/keyboard-core.mjs';

export const VERBS = ['move', 'select', 'back', 'home', 'menu'];
export const DIRECTIONS = ['up', 'down', 'left', 'right'];

/* KeyboardEvent.code -> [verb, direction]. Codes are positional (the keyboard pack's
   names), so the arrows and Enter are the same keys on every layout. */
export const KEY_VERBS = {
  ArrowUp: ['move', 'up'], ArrowDown: ['move', 'down'], ArrowLeft: ['move', 'left'], ArrowRight: ['move', 'right'],
  Enter: ['select'], NumpadEnter: ['select'], Space: ['select'],
  Backspace: ['back'], Escape: ['back'], BrowserBack: ['back'],
  BrowserHome: ['home'],
  ContextMenu: ['menu'],
};

/* Remote buttons some TV browsers send with an empty code: matched by key name only. */
export const REMOTE_KEY_NAMES = {
  GoBack: ['back'], BrowserBack: ['back'], XF86Back: ['back'],
  GoHome: ['home'], BrowserHome: ['home'],
  ContextMenu: ['menu'], Menu: ['menu'],
  Select: ['select'], Accept: ['select'],
};

/* Gamepad standard-mapping names -> [verb, direction]. */
export const PAD_VERBS = {
  up: ['move', 'up'], down: ['move', 'down'], left: ['move', 'left'], right: ['move', 'right'],
  south: ['select'], east: ['back'], menu: ['menu'], home: ['home'],
};

/* Plain words for each verb, for prompts and the README's table. */
export const VERB_WORDS = { move: 'Move', select: 'Select', back: 'Back', home: 'Home', menu: 'Menu' };

/* The verb for one key: [verb, direction] or null. `key` is looked at only when the
   code is missing, and only against REMOTE_KEY_NAMES. */
export function verbForKey(code, key) {
  if (typeof code === 'string' && code && code !== 'Unidentified') return KEY_VERBS[code] ?? null;
  if (typeof key === 'string' && Object.hasOwn(REMOTE_KEY_NAMES, key)) return REMOTE_KEY_NAMES[key];
  return null;
}

/* The verb for one gamepad button name, or null. */
export const verbForButton = (name) => PAD_VERBS[name] ?? null;

/* The left stick as a direction: the larger axis past the threshold, else null. */
export function stickDirection(lx = 0, ly = 0, threshold = 0.5) {
  const ax = Math.abs(lx), ay = Math.abs(ly);
  if (Math.max(ax, ay) < threshold) return null;
  return ax > ay ? (lx > 0 ? 'right' : 'left') : (ly > 0 ? 'down' : 'up');
}

/* Pads to verbs, one frame at a time. Pure: hand it the gamepad hub's pads and a time
   in ms, get back the verbs that frame produced. A press fires once; a held move (the
   D-pad or the stick) fires again after `delay` ms and then every `rate` ms, as a TV
   remote does. Pads with a non-standard mapping are skipped. */
export function createPadReader({ delay = 400, rate = 150, threshold = 0.5 } = {}) {
  const was = new Map();   // pad index -> Set of held names (buttons + 'stick:dir')
  const held = new Map();  // `${index}:${name}` -> next repeat time
  return {
    step(pads = [], now = 0) {
      const out = [], seen = new Set();
      for (const p of pads) {
        if (!p || !p.standard) continue;
        seen.add(p.index);
        const before = was.get(p.index) ?? new Set(), now_ = new Set();
        for (const [name, b] of Object.entries(p.buttons || {})) if (b?.pressed && PAD_VERBS[name]) now_.add(name);
        const sd = stickDirection(p.axes?.lx, p.axes?.ly, threshold);
        if (sd && !now_.has(sd)) now_.add('stick:' + sd);
        for (const name of now_) {
          const v = name.startsWith('stick:') ? ['move', name.slice(6)] : PAD_VERBS[name];
          const k = `${p.index}:${name}`;
          if (!before.has(name)) {
            out.push({ verb: v[0], dir: v[1] ?? null, code: name, pad: p.index, repeat: false });
            if (v[0] === 'move') held.set(k, now + delay);
          } else if (v[0] === 'move' && held.has(k) && now >= held.get(k)) {
            out.push({ verb: v[0], dir: v[1], code: name, pad: p.index, repeat: true });
            held.set(k, now + rate);
          }
        }
        for (const name of before) if (!now_.has(name)) held.delete(`${p.index}:${name}`);
        was.set(p.index, now_);
      }
      for (const i of [...was.keys()]) if (!seen.has(i)) { for (const n of was.get(i)) held.delete(`${i}:${n}`); was.delete(i); }
      return out;
    },
    reset() { was.clear(); held.clear(); },
  };
}

/* The remote: every source above, one stream of verbs.

     const remote = createRemote({ target: shellEl, pad: sharedHub() });
     remote.on(({ verb, dir, source, code }) => ...);
     remote.start();

   Each verb also goes out as a `tk-tv-verb` CustomEvent on `target` (bubbling,
   composed, cancelable): a host that calls preventDefault() keeps the verb for itself.
   `on` listeners see the event's defaultPrevented after it has been dispatched.
   `accept(detail)`, when given, can turn a verb away before anything sees it (the shell
   uses it so a pad never moves focus out from under another part of the page). */
export function createRemote({ target = globalThis.window, keys = true, keyboard = null, pad = null, capture = false, repeat = {}, now, accept = null } = {}) {
  const subs = new Set();
  const clock = now || (() => (globalThis.performance?.now?.() ?? Date.now()));
  const reader = createPadReader(repeat);
  let running = false, offKeyboard = null, offPad = null, handled = new Set();
  function fire(verb, dir = null, source = 'api', code = null) {
    if (!VERBS.includes(verb)) return null;
    if (verb === 'move' && !DIRECTIONS.includes(dir)) return null;
    const detail = { verb, dir: verb === 'move' ? dir : null, source, code };
    if (typeof accept === 'function' && !accept(detail)) return null;
    let prevented = false;
    if (target && typeof target.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      const ev = new CustomEvent('tk-tv-verb', { detail, bubbles: true, composed: true, cancelable: true });
      target.dispatchEvent(ev); prevented = ev.defaultPrevented;
    }
    const out = { ...detail, defaultPrevented: prevented };
    for (const f of subs) { try { f(out); } catch {} }
    return out;
  }
  function onKeyDown(e) {
    if (!e || e.defaultPrevented) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;               // the browser's shortcuts stay the browser's
    if (e.isComposing || e.keyCode === 229) return;               // an IME is composing
    if (!capture && isEditableTarget(e)) return;                   // typing in a field is not navigating
    const v = verbForKey(e.code, e.key); if (!v) return;
    e.preventDefault?.();                                          // no page scroll, no native double activation
    const id = e.code || e.key; handled.add(id);
    if (e.repeat && v[0] !== 'move') return;                       // a held arrow repeats; a held Enter does not
    fire(v[0], v[1] ?? null, 'key', id);
  }
  function onKeyUp(e) {
    const id = e?.code || e?.key;
    if (id && handled.delete(id)) e.preventDefault?.();          // Space activates on keyup: stop it once handled
  }
  function onPads(all) { for (const v of reader.step(all, clock())) fire(v.verb, v.dir, 'pad', v.code); }
  const remote = {
    on(fn) { subs.add(fn); return () => subs.delete(fn); },
    /* A verb from anywhere else (an on-screen D-pad, the phone remote, a test). */
    press(verb, dir = null, source = 'api') { return fire(verb, dir, source, null); },
    start() {
      if (running) return; running = true;
      if (keys && target && typeof target.addEventListener === 'function') { target.addEventListener('keydown', onKeyDown); target.addEventListener('keyup', onKeyUp); }
      if (keyboard && typeof keyboard.on === 'function') {
        const off = keyboard.on((type, d) => { if (type !== 'down' || !d) return; const v = verbForKey(d.code); if (v) fire(v[0], v[1] ?? null, 'keyboard', d.code); });
        const unsub = keyboard.subscribe?.(() => {});
        offKeyboard = () => { off?.(); unsub?.(); };
      }
      if (pad && typeof pad.subscribe === 'function') offPad = pad.subscribe(onPads);
    },
    stop() {
      if (!running) return; running = false;
      if (target && typeof target.removeEventListener === 'function') { target.removeEventListener('keydown', onKeyDown); target.removeEventListener('keyup', onKeyUp); }
      offKeyboard?.(); offKeyboard = null; offPad?.(); offPad = null; reader.reset(); handled = new Set();
    },
    get running() { return running; },
  };
  return remote;
}
