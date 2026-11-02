/* TokenKit keyboard pack: the input core against mocked KeyboardEvents, the art's
   contract (every key drawn once, inside its viewBox, no maker marks) and the replay
   source. Run: node --test src/packs/keyboard/tests/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKeyboardHub, parseKeys, toView, usLabel, capLabel, keyWord, isEditableTarget, layoutLabels, CLUSTERS, MAIN, ARROWS, KNOWN_CODES } from '../keyboard-core.mjs';
import { keyboardSVG, keyboardLayout, CAP_R, FACE_R, FACE_INSET, DECK_R, DECK_PAD, CAP_INSET, RING_R, RING } from '../keyboard-art.mjs';
import { createKeyReplay, syncKeysToMedia, KEY_STATES } from '../keyboard-replay.mjs';
import { describeKeys, defineKeyboardElements } from '../tk-keyboard.mjs';

/* A window and a document that hold listeners and fire plain event objects. */
function mockEnv() {
  const make = () => { const h = {}; return { h, addEventListener: (t, f) => { (h[t] ||= []).push(f); }, removeEventListener: (t, f) => { h[t] = (h[t] || []).filter((x) => x !== f); }, fire: (t, e = {}) => (h[t] || []).forEach((f) => f(e)), count: (t) => (h[t] || []).length }; };
  const win = make(), doc = { ...make(), visibilityState: 'visible' };
  return { win, doc };
}
/* What a browser hands a keydown listener. `key` is filled in to prove it's never read. */
const ev = (code, o = {}) => ({ code, key: 'secret-' + code, repeat: false, isComposing: false, keyCode: 0, target: { tagName: 'BODY' }, ...o });
const field = (tagName, extra = {}) => ({ tagName, getAttribute: () => null, ...extra });

test('positional codes: held and released by event.code, never event.key', () => {
  const { win, doc } = mockEnv(); const hub = createKeyboardHub({ win, doc }); const seen = [];
  hub.subscribe((h) => seen.push(h.slice()));
  win.fire('keydown', ev('KeyW', { key: 'z' }));     // AZERTY: the key at W's place types z
  win.fire('keydown', ev('ShiftLeft', { key: 'Shift' }));
  assert.deepEqual(hub.held(), ['KeyW', 'ShiftLeft']);
  win.fire('keyup', ev('KeyW', { key: 'Z' }));
  assert.deepEqual(hub.held(), ['ShiftLeft']);
  assert.deepEqual(seen, [['KeyW'], ['KeyW', 'ShiftLeft'], ['ShiftLeft']]);
  assert.ok(!JSON.stringify(seen).includes('secret') && !JSON.stringify(seen).includes('"z"'), 'the typed character is never kept');
});

test('auto-repeat and IME composition change nothing; events fire on press and release only', () => {
  const { win, doc } = mockEnv(); const hub = createKeyboardHub({ win, doc }); const evs = [];
  hub.on((t, d) => evs.push(`${t}:${d.code}`)); hub.subscribe(() => {});
  win.fire('keydown', ev('Space')); win.fire('keydown', ev('Space', { repeat: true })); win.fire('keydown', ev('Space', { repeat: true }));
  win.fire('keydown', ev('KeyA', { isComposing: true })); win.fire('keydown', ev('KeyS', { keyCode: 229 }));
  win.fire('keydown', ev('')); win.fire('keydown', ev('Unidentified'));
  win.fire('keyup', ev('Space')); win.fire('keyup', ev('Space'));
  assert.deepEqual(evs, ['down:Space', 'up:Space']);
  assert.deepEqual(hub.held(), []);
  for (const d of [{}, null, { code: 7 }]) assert.doesNotThrow(() => win.fire('keydown', d));
});

test('blur and a hidden page clear every held key: nothing sticks', () => {
  const { win, doc } = mockEnv(); const hub = createKeyboardHub({ win, doc }); const evs = [];
  hub.on((t, d) => evs.push(`${t}:${d.code}:${d.reason ?? ''}`)); hub.subscribe(() => {});
  win.fire('keydown', ev('KeyW')); win.fire('keydown', ev('KeyD'));
  win.fire('blur');
  assert.deepEqual(hub.held(), []);
  assert.deepEqual(evs.slice(-2), ['up:KeyW:blur', 'up:KeyD:blur']);
  win.fire('keydown', ev('ArrowUp'));
  doc.fire('visibilitychange'); assert.deepEqual(hub.held(), ['ArrowUp'], 'still visible: nothing cleared');
  doc.visibilityState = 'hidden'; doc.fire('visibilitychange');
  assert.deepEqual(hub.held(), []);
  assert.equal(evs.at(-1), 'up:ArrowUp:hidden');
});

test('releasing Meta lets go of keys whose keyup macOS never sends', () => {
  const { win, doc } = mockEnv(); const hub = createKeyboardHub({ win, doc }); hub.subscribe(() => {});
  win.fire('keydown', ev('MetaLeft')); win.fire('keydown', ev('ShiftLeft')); win.fire('keydown', ev('KeyS'));
  win.fire('keyup', ev('MetaLeft'));
  assert.deepEqual(hub.held(), ['ShiftLeft'], 'S released with Meta; Shift (a modifier) keeps its own keyup');
});

test('typing in an input, textarea, select or contenteditable is ignored, unless capture', () => {
  const targets = [field('INPUT'), field('textarea'), field('SELECT'), { tagName: 'DIV', isContentEditable: true }, { tagName: 'P', getAttribute: (n) => (n === 'contenteditable' ? '' : null) }];
  for (const t of targets) assert.equal(isEditableTarget({ target: t }), true, t.tagName);
  // a field inside a shadow root: the composed path starts at the field
  const host = { tagName: 'TK-SEARCH', getAttribute: () => null };
  assert.equal(isEditableTarget({ target: host, composedPath: () => [field('INPUT'), host] }), true);
  assert.equal(isEditableTarget({ target: { tagName: 'P', getAttribute: (n) => (n === 'contenteditable' ? 'false' : null) } }), false);
  assert.equal(isEditableTarget({ target: field('BUTTON') }), false);

  const { win, doc } = mockEnv(); const hub = createKeyboardHub({ win, doc }); hub.subscribe(() => {});
  for (const t of targets) win.fire('keydown', ev('KeyW', { target: t }));
  assert.deepEqual(hub.held(), [], 'nothing held while typing');
  win.fire('keydown', ev('KeyW'));                         // pressed on the page...
  win.fire('keyup', ev('KeyW', { target: field('INPUT') })); // ...released after focus moved into a field
  assert.deepEqual(hub.held(), [], 'a release always counts');

  const cap = createKeyboardHub({ ...mockEnv(), capture: true });
  const e2 = mockEnv(); const capHub = createKeyboardHub({ win: e2.win, doc: e2.doc, capture: true }); capHub.subscribe(() => {});
  e2.win.fire('keydown', ev('KeyW', { target: field('INPUT') }));
  assert.deepEqual(capHub.held(), ['KeyW'], 'capture reads keys in fields too');
  assert.equal(cap.capture, true);
});

test('listeners go on with the first listener and come off with the last', () => {
  const { win, doc } = mockEnv(); const hub = createKeyboardHub({ win, doc });
  assert.equal(win.count('keydown'), 0, 'nothing listens until someone subscribes');
  const a = hub.subscribe(() => {}), b = hub.on(() => {});
  assert.equal(win.count('keydown'), 1); assert.equal(win.count('keyup'), 1); assert.equal(win.count('blur'), 1); assert.equal(doc.count('visibilitychange'), 1);
  win.fire('keydown', ev('KeyW'));
  a(); assert.equal(win.count('keydown'), 1, 'an event listener is still there');
  b();
  for (const t of ['keydown', 'keyup', 'blur']) assert.equal(win.count(t), 0, t);
  assert.equal(doc.count('visibilitychange'), 0);
  assert.deepEqual(hub.held(), [], 'stopping forgets what was held');
  assert.equal(createKeyboardHub({ win: null, doc: null }).supported, false);
  assert.doesNotThrow(() => createKeyboardHub({ win: null, doc: null }).subscribe(() => {})());
});

test('clusters and single codes: parseKeys, the default, labels and words', () => {
  assert.deepEqual(parseKeys(), [...CLUSTERS.wasd, ...CLUSTERS.arrows, 'Space', 'ShiftLeft']);
  assert.deepEqual(parseKeys('wasd KeyF KeyR KeyW'), ['KeyQ', 'KeyW', 'KeyE', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyR'], 'clusters expanded, duplicates dropped');
  assert.deepEqual(parseKeys('numbers9').length, 9);
  assert.deepEqual(parseKeys(['esc', 'tab', 'ctrl', 'enter', 'fkeys', 'numbers']), ['Escape', 'Tab', 'ControlLeft', 'Enter', 'F1', 'F2', 'F3', 'F4', 'Digit1', 'Digit2', 'Digit3', 'Digit4']);
  assert.deepEqual(parseKeys('Numpad5 nonsense ARROWS'), CLUSTERS.arrows, 'codes the picture cannot draw are left out; cluster names ignore case');
  assert.equal(usLabel('KeyW'), 'W'); assert.equal(usLabel('Digit7'), '7'); assert.equal(usLabel('Slash'), '/'); assert.equal(usLabel('ShiftLeft'), 'Shift'); assert.equal(usLabel('ArrowUp'), '');
  const azerty = new Map([['KeyW', 'z'], ['KeyQ', 'a'], ['Digit1', '&'], ['ShiftLeft', 'x']]);
  assert.equal(capLabel('KeyW', azerty), 'Z', "the layout's own letter");
  assert.equal(capLabel('ShiftLeft', azerty), 'Shift', 'modifiers keep their words');
  assert.equal(capLabel('KeyE', azerty), 'E', 'missing from the map: the US label');
  assert.equal(capLabel('Digit2', new Map([['Digit2', 'é']])), 'é', 'only letter keys are upper-cased');
  assert.equal(keyWord('KeyW'), 'W key'); assert.equal(keyWord('KeyW', azerty), 'Z key'); assert.equal(keyWord('Space'), 'Space bar'); assert.equal(keyWord('ArrowLeft'), 'Left arrow'); assert.equal(keyWord('Comma'), 'Comma key');
  assert.equal(describeKeys(), 'W A S D (with Q and E), arrow keys, Space bar, Left Shift');
  assert.equal(describeKeys('KeyF numbers'), 'F key, 1 to 4');
  assert.deepEqual(toView({ pressed: ['KeyW', 3, ''] }).pressed, ['KeyW']); assert.deepEqual(toView(['Space']).pressed, ['Space']); assert.deepEqual(toView(null).pressed, []);
});

test('layout map: used where offered, null where missing or refused', async () => {
  assert.equal(await layoutLabels({}), null);
  assert.equal(await layoutLabels({ keyboard: { getLayoutMap: () => Promise.reject(new Error('not top-level')) } }), null);
  assert.equal(await layoutLabels({ keyboard: { getLayoutMap: () => { throw new Error('denied'); } } }), null);
  const m = await layoutLabels({ keyboard: { getLayoutMap: async () => new Map([['KeyQ', 'a']]) } });
  assert.equal(m.get('KeyQ'), 'a');
});

test('art: every key drawn once, inside the viewBox, radii concentric', () => {
  const svg = keyboardSVG({ codes: KNOWN_CODES, uid: 't' });
  for (const c of KNOWN_CODES) assert.equal(svg.split(`data-code="${c}"`).length - 1, 1, c);
  for (const keys of [KNOWN_CODES, parseKeys(), parseKeys('arrows'), parseKeys('wasd'), parseKeys('KeyF space'), ['ArrowUp']]) {
    const { viewBox: [x0, y0, w, h], caps } = keyboardLayout(keys);
    assert.equal(caps.length, keys.length);
    for (const c of caps) assert.ok(c.x >= x0 + DECK_PAD && c.y >= y0 + DECK_PAD && c.x + c.w <= w - DECK_PAD + 1e-6 && c.y + c.h <= h - DECK_PAD + 1e-6, `${c.code} in ${keys.join(' ')}`);
    for (let i = 0; i < caps.length; i++) for (let j = i + 1; j < caps.length; j++) { const a = caps[i], b = caps[j]; assert.ok(a.x + a.w <= b.x + 1e-6 || b.x + b.w <= a.x + 1e-6 || a.y + a.h <= b.y + 1e-6 || b.y + b.h <= a.y + 1e-6, `${a.code} overlaps ${b.code}`); }
  }
  // the arrows sit right of the main block with their bottoms on its bottom row
  const { caps } = keyboardLayout(parseKeys());
  const at = (c) => caps.find((k) => k.code === c);
  assert.ok(at('ArrowLeft').x > at('Space').x + at('Space').w);
  assert.equal(at('ArrowDown').y, at('Space').y);
  assert.ok(at('KeyA').x > at('KeyQ').x, 'the home row is staggered right of the top row');
  assert.equal(FACE_R, CAP_R - FACE_INSET); assert.equal(DECK_R, CAP_R + CAP_INSET + DECK_PAD); assert.equal(RING_R, CAP_R + RING);
  assert.ok(keyboardSVG({ codes: [] }).includes('data-keys="0"'));
  assert.ok(keyboardSVG({ title: 'A <b> & "c"' }).includes('aria-label="A &lt;b&gt; &amp; &quot;c&quot;"'), 'the name is escaped');
  assert.ok(keyboardSVG({ codes: ['KeyW'], labels: { KeyW: 'z' } }).includes('>Z</text>'));
});

test('art: no maker marks', () => {
  const all = keyboardSVG({ codes: KNOWN_CODES });
  assert.ok(!/logitech|razer|corsair|apple|microsoft|windows|command|⌘|⊞|steelseries|keychron/i.test(all));
  assert.equal(Object.keys(MAIN).length + Object.keys(ARROWS).length, KNOWN_CODES.length);
});

/* ---- replay input source ---- */
import { readFileSync } from 'node:fs';
const run = JSON.parse(readFileSync(new URL('../replays/sample-run.json', import.meta.url), 'utf8'));

test('replay: at() boundaries, press events, hold', () => {
  const r = createKeyReplay(run.frames);
  assert.ok(r.frames.length >= 10 && r.duration > 5);
  assert.deepEqual(r.at(r.start - 1).pressed, [], 'before the first frame: nothing');
  assert.equal(r.at(r.start - 1).frame, null);
  assert.deepEqual(r.at(0.5).pressed, ['KeyW']);
  assert.deepEqual(r.at(1.5).pressed.sort(), ['KeyW', 'ShiftLeft', 'Space'].sort());
  assert.ok(!r.at(1.39).pressed.includes('Space'), 'not a frame early');
  const first = (c) => r.events.find((e) => e.code === c)?.t;
  assert.equal(first('KeyW'), 0.2); assert.equal(first('ShiftLeft'), 0.8); assert.equal(first('Space'), 1.4);
  assert.ok(r.at(r.start + r.duration + 5).frame, 'after the end: holds the last frame');
  const tap = createKeyReplay([{ t: 0, keys: [] }, { t: 1, keys: ['KeyE'] }, { t: 1.03, keys: [] }], { hold: 0.2 });
  assert.ok(tap.at(1.1).pressed.includes('KeyE'), 'hold keeps a 30 ms tap visible');
  assert.ok(!tap.at(1.25).pressed.includes('KeyE'));
  assert.equal(KEY_STATES.frame({ pressed: ['Tab'] }).pressed[0], 'Tab');
});

test('replay: junk frames, a custom map and a throwing map never throw', () => {
  assert.doesNotThrow(() => createKeyReplay(null).at(1));
  assert.equal(createKeyReplay([]).duration, 0);
  const r = createKeyReplay([{ t: 'x' }, null, { t: 0, keys: 'KeyW' }, { t: 1, keys: ['KeyD', 4] }, 7]);
  assert.equal(r.frames.length, 2); assert.deepEqual(r.at(0).pressed, []); assert.deepEqual(r.at(1).pressed, ['KeyD']);
  const game = createKeyReplay([{ time: 0, forward: true }, { time: 1, forward: true, jump: true }], { timeKey: 'time', map: (f) => ({ pressed: [f.forward && 'KeyW', f.jump && 'Space'].filter(Boolean) }) });
  assert.deepEqual(game.at(1).pressed, ['KeyW', 'Space']);
  const bad = createKeyReplay([{ t: 0 }, { t: 1 }], { map: () => { throw new Error('boom'); } });
  assert.deepEqual(bad.at(0.5).pressed, []);
});

test('replay: syncKeysToMedia follows a (fake) video, ticks only while it plays, stops cleanly', () => {
  const r = createKeyReplay(run.frames);
  const ls = {}; const cbs = [];
  const media = { currentTime: 0, paused: true, addEventListener: (k, f) => (ls[k] = f), removeEventListener: (k) => delete ls[k], requestVideoFrameCallback: (f) => cbs.push(f), cancelVideoFrameCallback() {} };
  const seen = []; const target = { set state(s) { seen.push(s); } };
  const stop = syncKeysToMedia(r, media, target, { offset: 1 });
  assert.equal(cbs.length, 0, 'paused: no frame callbacks asked for');
  media.currentTime = 0.45; ls.seeked();
  assert.ok(seen.at(-1).pressed.includes('Space'), 'clip 0.45 s + offset 1 s = replay 1.45 s: jumping');
  media.paused = false; ls.play();
  assert.equal(cbs.length, 1);
  cbs.shift()(0, { mediaTime: 4 });
  assert.equal(seen.at(-1).t, 5); assert.equal(cbs.length, 1, 'playing: asks for the next frame');
  media.paused = true; cbs.shift()(0, { mediaTime: 4.1 });
  assert.equal(cbs.length, 0, 'paused again: stops asking');
  stop();
  assert.equal(Object.keys(ls).length, 0, 'listeners removed');
});

test('elements define themselves only where customElements exists', () => {
  assert.equal(defineKeyboardElements(undefined), false);
  const reg = new Map(); const fake = { get: (n) => reg.get(n), define: (n, c) => reg.set(n, c) };
  assert.equal(defineKeyboardElements(fake), true);
  assert.deepEqual([...reg.keys()], ['tk-keyboard', 'tk-key-prompt']);
});
