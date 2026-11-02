/* TokenKit TV pack: the remote contract (keys, the gamepad pack's pads and the keyboard
   pack's hub to five verbs, fields ignored) and spatial focus (a grid, rows with memory,
   the sidebar beside them, Back). Run: node --test src/packs/tv/tests/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRemote, createPadReader, verbForKey, verbForButton, stickDirection, VERBS, KEY_VERBS, PAD_VERBS } from '../tv-remote.mjs';
import { createFocusNav, pickNext, isAhead, rectOf, r } from '../tv-focus.mjs';
import { createKeyboardHub } from '../../keyboard/keyboard-core.mjs';
import { createGamepadHub } from '../../gamepad/gamepad-core.mjs';
import { osdSummary, defineTvElements, SIZES } from '../tk-tv.mjs';

/* An event target that holds listeners and fires plain event objects. */
function target() {
  const h = {};
  return { h, addEventListener: (t, f) => { (h[t] ||= []).push(f); }, removeEventListener: (t, f) => { h[t] = (h[t] || []).filter((x) => x !== f); }, fire: (t, e) => (h[t] || []).forEach((f) => f(e)), count: (t) => (h[t] || []).length };
}
/* What a browser hands a keydown listener; preventDefault is recorded. */
const key = (code, o = {}) => { const e = { code, key: 'secret-' + code, repeat: false, isComposing: false, keyCode: 0, target: { tagName: 'BODY' }, defaultPrevented: false, prevented: 0, ...o }; e.preventDefault = () => { e.prevented++; e.defaultPrevented = true; }; return e; };
const field = (tagName, extra = {}) => ({ tagName, getAttribute: () => null, ...extra });
const verbs = (log) => log.map((d) => (d.dir ? `${d.verb}:${d.dir}` : d.verb));

test('the contract is five verbs', () => {
  assert.deepEqual(VERBS, ['move', 'select', 'back', 'home', 'menu']);
  for (const v of [...Object.values(KEY_VERBS), ...Object.values(PAD_VERBS)]) assert.ok(VERBS.includes(v[0]));
});

test('keys: arrows move, Enter and Space select, Backspace and Escape go back', () => {
  const t = target(); const remote = createRemote({ target: t }); const log = []; remote.on((d) => log.push(d)); remote.start();
  const evs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'NumpadEnter', 'Space', 'Backspace', 'Escape', 'BrowserBack', 'BrowserHome', 'ContextMenu'].map((c) => key(c));
  for (const e of evs) t.fire('keydown', e);
  assert.deepEqual(verbs(log), ['move:up', 'move:down', 'move:left', 'move:right', 'select', 'select', 'select', 'back', 'back', 'back', 'home', 'menu']);
  assert.ok(evs.every((e) => e.prevented === 1), 'a handled key never scrolls the page or double-activates');
  assert.ok(log.every((d) => d.source === 'key'));
  assert.ok(!JSON.stringify(log).includes('secret'), 'the typed character is never read for a key with a code');
  const other = key('KeyW'); t.fire('keydown', other);
  assert.equal(log.length, 12, 'keys outside the contract do nothing'); assert.equal(other.prevented, 0, 'and are left alone');
});

test('keys: a held arrow repeats, a held Enter does not; Space is stopped on keyup too', () => {
  const t = target(); const remote = createRemote({ target: t }); const log = []; remote.on((d) => log.push(d)); remote.start();
  t.fire('keydown', key('ArrowRight')); t.fire('keydown', key('ArrowRight', { repeat: true })); t.fire('keydown', key('ArrowRight', { repeat: true }));
  t.fire('keydown', key('Enter')); const rep = key('Enter', { repeat: true }); t.fire('keydown', rep);
  assert.deepEqual(verbs(log), ['move:right', 'move:right', 'move:right', 'select']);
  assert.equal(rep.prevented, 1, 'the repeat is still kept from the page');
  t.fire('keydown', key('Space')); const up = key('Space'); t.fire('keyup', up);
  assert.equal(up.prevented, 1);
  const stray = key('Space'); t.fire('keyup', stray); assert.equal(stray.prevented, 0, 'a keyup with no handled keydown is left alone');
});

test('keys in a text field are ignored unless capture is set; shortcuts and IME too', () => {
  const t = target(); const remote = createRemote({ target: t }); const log = []; remote.on((d) => log.push(d)); remote.start();
  for (const f of [field('INPUT'), field('textarea'), field('SELECT'), field('DIV', { isContentEditable: true }), field('DIV', { getAttribute: (n) => (n === 'contenteditable' ? '' : null) })]) {
    const e = key('ArrowLeft', { target: f }); t.fire('keydown', e); assert.equal(e.prevented, 0, 'the caret still moves');
  }
  const inShadow = key('Backspace', { composedPath: () => [field('INPUT'), field('DIV')] }); t.fire('keydown', inShadow);
  t.fire('keydown', key('ArrowLeft', { ctrlKey: true })); t.fire('keydown', key('ArrowLeft', { altKey: true })); t.fire('keydown', key('Enter', { metaKey: true }));
  t.fire('keydown', key('Enter', { isComposing: true })); t.fire('keydown', key('Enter', { keyCode: 229 }));
  assert.deepEqual(log, []);
  const t2 = target(); const cap = createRemote({ target: t2, capture: true }); const log2 = []; cap.on((d) => log2.push(d)); cap.start();
  t2.fire('keydown', key('ArrowLeft', { target: field('INPUT') }));
  assert.deepEqual(verbs(log2), ['move:left']);
});

test('TV remote keys with no code are matched by name only', () => {
  assert.deepEqual(verbForKey('', 'GoBack'), ['back']);
  assert.deepEqual(verbForKey('Unidentified', 'XF86Back'), ['back']);
  assert.deepEqual(verbForKey('', 'GoHome'), ['home']);
  assert.equal(verbForKey('', 'a'), null, 'a character never maps');
  assert.equal(verbForKey('', 'Enter2'), null);
  assert.equal(verbForKey('KeyA', 'Escape'), null, 'with a code, the key name is never looked at');
  assert.equal(verbForKey('', 'toString'), null, 'no prototype keys');
});

test('the keyboard pack hub: its press events by code', () => {
  const win = target(), doc = { ...target(), visibilityState: 'visible' };
  const hub = createKeyboardHub({ win, doc });
  const remote = createRemote({ target: null, keys: false, keyboard: hub }); const log = []; remote.on((d) => log.push(d)); remote.start();
  win.fire('keydown', key('ArrowDown')); win.fire('keyup', key('ArrowDown'));
  win.fire('keydown', key('Enter')); win.fire('keydown', key('KeyW'));
  win.fire('keydown', key('Escape', { target: field('INPUT') }));   // the hub ignores fields itself
  assert.deepEqual(verbs(log), ['move:down', 'select']);
  assert.ok(log.every((d) => d.source === 'keyboard'));
  remote.stop(); assert.equal(win.count('keydown'), 0, 'stopping lets the hub take its listeners off');
});

/* Gamepad API look-alikes: standard mapping, 17 buttons, 4 axes. */
const STD = ['south', 'east', 'west', 'north', 'lb', 'rb', 'lt', 'rt', 'view', 'menu', 'ls', 'rs', 'up', 'down', 'left', 'right', 'home'];
const gp = (index, pressed = [], axes = [0, 0, 0, 0], mapping = 'standard') => ({ index, id: 'Test pad', mapping, connected: true, timestamp: 1, axes, buttons: STD.map((n) => ({ pressed: pressed.includes(n), value: pressed.includes(n) ? 1 : 0 })) });
const padState = (index, pressed = [], lx = 0, ly = 0, standard = true) => ({ index, standard, buttons: Object.fromEntries(STD.map((n) => [n, { pressed: pressed.includes(n), value: pressed.includes(n) ? 1 : 0 }])), axes: { lx, ly, rx: 0, ry: 0 } });

test('pads: the D-pad moves, A selects, B goes back, Menu and Home are theirs', () => {
  const rd = createPadReader();
  const seq = [[], ['up'], [], ['right'], [], ['south'], [], ['east'], [], ['menu'], [], ['home'], [], ['north', 'lb', 'view']];
  const out = seq.flatMap((p, i) => rd.step([padState(0, p)], i * 16));
  assert.deepEqual(out.map((d) => (d.dir ? `${d.verb}:${d.dir}` : d.verb)), ['move:up', 'move:right', 'select', 'back', 'menu', 'home']);
  assert.equal(verbForButton('west'), null); assert.deepEqual(verbForButton('south'), ['select']);
});

test('pads: a press fires once; a held move repeats after the delay, then at the rate', () => {
  const rd = createPadReader({ delay: 400, rate: 150 }); const at = (t, p, lx = 0, ly = 0) => rd.step([padState(0, p, lx, ly)], t).map((d) => `${d.verb}${d.dir ? ':' + d.dir : ''}${d.repeat ? '+' : ''}`);
  assert.deepEqual(at(0, ['down']), ['move:down']);
  assert.deepEqual(at(200, ['down']), []);
  assert.deepEqual(at(400, ['down']), ['move:down+']);
  assert.deepEqual(at(500, ['down']), []);
  assert.deepEqual(at(550, ['down']), ['move:down+']);
  assert.deepEqual(at(600, []), []);
  assert.deepEqual(at(700, ['south']), ['select']);
  assert.deepEqual(at(1500, ['south']), [], 'a held A never repeats');
  assert.deepEqual(at(1600, [], 0.9, 0.2), ['move:right'], 'the stick: the larger axis past half way');
  assert.deepEqual(at(2100, [], 0.9, 0.2), ['move:right+']);
  assert.deepEqual(at(2200, [], 0.3, 0.1), [], 'inside the threshold: nothing');
  assert.deepEqual(at(2300, ['left'], -0.9, 0), ['move:left'], 'D-pad and stick the same way: one move');
  assert.equal(stickDirection(0, -0.7), 'up'); assert.equal(stickDirection(0.2, 0.2), null);
});

test('pads: a non-standard mapping is never guessed at; several pads each count', () => {
  const rd = createPadReader();
  assert.deepEqual(rd.step([padState(0, ['south'], 0, 0, false)], 0), []);
  const out = rd.step([padState(0, ['south']), padState(1, ['east'])], 16);
  assert.deepEqual(out.map((d) => `${d.pad}:${d.verb}`), ['0:select', '1:back']);
  assert.deepEqual(rd.step([], 32), []);
  assert.deepEqual(rd.step([padState(0, ['south'])], 48).map((d) => d.verb), ['select'], 'a pad that left and came back starts fresh');
});

test('pads through the gamepad pack hub: verbs come out of the remote', () => {
  let pads = [gp(0)]; const frames = [];
  const hub = createGamepadHub({ nav: { getGamepads: () => pads }, win: null, raf: (f) => frames.push(f) });
  let t = 0; const remote = createRemote({ target: null, keys: false, pad: hub, now: () => t }); const log = []; remote.on((d) => log.push(d)); remote.start();
  pads = [gp(0, ['down'])]; t = 16; hub.poll();
  pads = [gp(0, ['south'])]; t = 32; hub.poll();
  pads = [gp(0, [], [0, 0, 0, 0], '')]; t = 48; hub.poll();
  assert.deepEqual(verbs(log), ['move:down', 'select']);
  assert.ok(log.every((d) => d.source === 'pad'));
  remote.stop();
});

test('verbs go out as cancelable tk-tv-verb events; accept can turn one away', () => {
  const seen = []; const t = { ...target(), dispatchEvent: (e) => { seen.push(e); if (e.detail.verb === 'back') e.preventDefault(); return true; } };
  const remote = createRemote({ target: t, accept: (d) => d.verb !== 'home' }); const log = []; remote.on((d) => log.push(d)); remote.start();
  remote.press('move', 'left'); remote.press('back'); remote.press('home'); remote.press('jump'); remote.press('move', 'sideways');
  assert.deepEqual(seen.map((e) => [e.type, e.bubbles, e.composed, e.cancelable]), [['tk-tv-verb', true, true, true], ['tk-tv-verb', true, true, true]]);
  assert.deepEqual(log.map((d) => [d.verb, d.defaultPrevented]), [['move', false], ['back', true]]);
  remote.stop(); assert.equal(t.count('keydown'), 0, 'listeners come off with stop');
});

/* ------------------------------------------------------------------ spatial focus */
/* A focus host over plain items: what <tk-tv-shell> does with the DOM. */
function host(items, start) {
  let cur = start ?? null; const moves = [];
  const nav = createFocusNav({ items: () => items, current: () => items.find((i) => i.key === cur) ?? null, focus: (it) => { cur = it.key; moves.push(it.key); } });
  if (cur) nav.remember(items.find((i) => i.key === cur));
  return { nav, get cur() { return cur; }, moves, set(k) { cur = k; nav.remember(items.find((i) => i.key === k)); } };
}
/* A 3 x 3 grid of 100 x 60 tiles with 20px gaps, no rows: g00 .. g22. */
const grid = () => { const out = []; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) out.push({ key: `g${y}${x}`, rect: r(200 + x * 120, 100 + y * 80, 100, 60), row: null, level: 'main' }); return out; };

test('grid: moves go to the neighbour; the edges stop (no wrap)', () => {
  const h = host(grid(), 'g11');
  for (const [dir, to] of [['up', 'g01'], ['down', 'g21'], ['left', 'g10'], ['right', 'g12']]) { h.set('g11'); assert.equal(h.nav.move(dir)?.key, to, dir); }
  h.set('g02'); assert.equal(h.nav.move('right'), null, 'no wrap at the end of a line'); assert.equal(h.cur, 'g02');
  h.set('g20'); assert.equal(h.nav.move('down'), null); assert.equal(h.nav.move('left'), null);
  h.set('g00'); h.nav.move('right'); h.nav.move('right'); h.nav.move('down'); h.nav.move('down'); h.nav.move('left');
  assert.deepEqual(h.moves.slice(-5), ['g01', 'g02', 'g12', 'g22', 'g21']);
});

test('geometry: ahead is by centre and far edge; a focused tile scaled over its neighbour still moves', () => {
  const a = r(0, 0, 100, 60);
  assert.ok(isAhead(a, r(120, 0, 100, 60), 'right')); assert.ok(!isAhead(a, r(120, 0, 100, 60), 'left'));
  assert.ok(!isAhead(a, r(10, 0, 100, 60), 'down'));
  const scaled = { key: 's', rect: r(-3, -8, 106, 64), level: 'main' };
  assert.equal(pickNext(scaled, [scaled, { key: 'n', rect: r(100, 0, 100, 60), level: 'main' }], 'right')?.key, 'n');
  assert.deepEqual(rectOf({ left: 1, top: 2, width: 3, height: 4 }), { x: 1, y: 2, w: 3, h: 4 });
  assert.equal(pickNext({ key: 'z', rect: a, level: 'main' }, [], 'up'), null);
  assert.equal(pickNext({ key: 'z', rect: a, level: 'main' }, grid(), 'diagonal'), null);
});

/* Three rows of tiles, each row scrolled differently (as rows are), and a sidebar of
   four items to their left. */
function screen() {
  const items = [];
  const rows = { films: { y: 100, x0: 300 }, music: { y: 300, x0: 240 }, games: { y: 500, x0: 330 } };
  for (const [row, { y, x0 }] of Object.entries(rows)) for (let i = 0; i < 6; i++) items.push({ key: `${row}${i}`, rect: r(x0 + i * 220, y, 200, 140), row, level: 'main' });
  ['home', 'films', 'music', 'games'].forEach((k, i) => items.push({ key: 'menu-' + k, rect: r(40, 120 + i * 90, 180, 60), row: null, level: 'menu' }));
  return items;
}

test('rows: down and up land on the nearest tile in the next row; each row remembers its last focus', () => {
  const h = host(screen(), 'films2');
  assert.equal(h.nav.move('down')?.key, 'music2', 'films2 (x 740) is over music2 (x 680)');
  h.nav.move('right'); h.nav.move('right'); assert.equal(h.cur, 'music4');
  assert.equal(h.nav.move('up')?.key, 'films2', 'back up: films remembers films2, not the tile above music4');
  assert.equal(h.nav.move('down')?.key, 'music4', 'and music remembers music4');
  assert.equal(h.nav.move('down')?.key, 'games4', 'games has no memory yet: geometry (music4 centred at 1220, games4 at 1310, games3 at 1090)');
  assert.equal(h.nav.move('down'), null, 'below the last row: nothing, never the sidebar');
  assert.equal(h.nav.lastIn('music'), 'music4');
});

test('rows: right at the end of a row stops; it never jumps to a longer row below', () => {
  const items = screen().filter((i) => !(i.row === 'films' && +i.key.slice(-1) > 2));
  const h = host(items, 'films2');
  assert.equal(h.nav.move('right'), null);
});

test('levels: left from the first tile reaches the sidebar item most level with it', () => {
  const h = host(screen(), 'music3');
  h.nav.move('left'); h.nav.move('left'); h.nav.move('left'); assert.equal(h.cur, 'music0');
  assert.equal(h.nav.move('left')?.key, 'menu-music', 'the sidebar item most level with music0 (y 300..440): Music (300..360), not Games (390..450)');
});

test('back returns to the previous level; with nowhere to go it says so', () => {
  const h = host(screen(), 'music3');
  assert.equal(h.nav.back(), false, 'nothing to go back to yet: the host decides');
  h.nav.move('left'); h.nav.move('left'); h.nav.move('left'); h.nav.move('left');
  assert.equal(h.cur, 'menu-music'); assert.equal(h.nav.depth, 1);
  h.nav.move('up'); assert.equal(h.cur, 'menu-films', 'up and down inside the sidebar');
  assert.equal(h.nav.back()?.key, 'music0', 'Back: to the row tile focus left from');
  assert.equal(h.nav.depth, 0); assert.equal(h.nav.back(), false);
  h.nav.move('left'); assert.equal(h.cur, 'menu-films', 'the sidebar remembers its last focus');
  assert.equal(h.nav.move('right')?.key, 'music0', 'right from the sidebar: back to the level\'s last focus');
  assert.equal(h.nav.depth, 0, 'going back the way focus came never grows the stack');
});

test('menu enters the sidebar and home goes to the first tile, forgetting the way back', () => {
  const h = host(screen(), 'games4');
  assert.equal(h.nav.enter('menu')?.key, 'menu-home'); assert.equal(h.nav.depth, 1);
  assert.equal(h.nav.enter('menu')?.key, 'menu-home', 'already there: stays');
  assert.equal(h.nav.back()?.key, 'games4');
  assert.equal(h.nav.home()?.key, 'films0'); assert.equal(h.nav.depth, 0);
  const empty = host([], null); assert.equal(empty.nav.move('down'), null); assert.equal(empty.nav.back(), false);
  const none = host(screen(), null); assert.equal(none.nav.move('right')?.key, 'films0', 'with nothing focused, the first move focuses the first tile');
});

test('the first time into a level, focus lands on its current item (the open page in the menu)', () => {
  const items = screen().map((i) => (i.key === 'menu-films' ? { ...i, current: true } : i));
  const h = host(items, 'games0');
  assert.equal(h.nav.move('left')?.key, 'menu-films', 'not menu-games, the item most level with games0');
  h.nav.move('down'); h.nav.back();
  assert.equal(h.nav.move('left')?.key, 'menu-music', 'after that, the menu remembers its last focus');
  const h2 = host(items, 'films3'); assert.equal(h2.nav.enter('menu')?.key, 'menu-films');
});

test('a bar above the rows is reached by up when it shares width; a sidebar item is not', () => {
  const items = [...screen(), { key: 'search', rect: r(300, 20, 600, 50), row: null, level: 'top' }];
  const h = host(items, 'films1');
  assert.equal(h.nav.move('up')?.key, 'search');
  h.set('films5'); assert.equal(h.nav.move('up'), null, 'films5 (x 1400) shares no width with the bar');
});

test('the OSD says itself in words; the elements module loads without a DOM', () => {
  assert.equal(osdSummary({ kind: 'volume', value: 40 }), 'Volume 40');
  assert.equal(osdSummary({ kind: 'volume', value: 140, muted: true }), 'Volume 100, muted');
  assert.equal(osdSummary({ kind: 'now-playing', label: 'Drama', detail: '1:24 of 3:30' }), 'Now playing: Drama, 1:24 of 3:30');
  assert.equal(osdSummary({ kind: 'now-playing', label: 'Drama', paused: true }), 'Paused: Drama');
  assert.equal(osdSummary({ kind: 'message', label: 'Pad connected' }), 'Pad connected');
  assert.equal(defineTvElements(undefined), false);
  assert.match(SIZES['text-body'], /1\.458cqw/, 'body text is 28px in a 1920-wide frame');
});
