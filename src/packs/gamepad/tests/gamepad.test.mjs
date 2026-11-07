/* TokenKit gamepad pack: the input core against a mocked navigator.getGamepads, and the
   art's contract (every standard control drawn, inside its viewBox, no maker marks).
   Run: node --test src/packs/gamepad/tests/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPad, toView, createGamepadHub, padFamily, STANDARD_BUTTONS, GLYPH_SETS, GLYPHS } from '../gamepad-core.mjs';
import { padSVG, guitarSVG, GEO, PAD_VIEWBOX, FRETS } from '../gamepad-art.mjs';

const btns = (n, down = {}) => Array.from({ length: n }, (_, i) => (i in down ? { pressed: down[i] > 0.5, value: down[i], touched: true } : { pressed: false, value: 0, touched: false }));
const pad = (o = {}) => ({ index: 0, id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', mapping: 'standard', connected: true, timestamp: 1, buttons: btns(17), axes: [0, 0, 0, 0], ...o });
function mockEnv(list) {
  const handlers = {}; const frames = [];
  const win = { addEventListener: (t, f) => { (handlers[t] ||= []).push(f); }, removeEventListener: (t, f) => { handlers[t] = (handlers[t] || []).filter((x) => x !== f); }, fire: (t, gamepad) => (handlers[t] || []).forEach((f) => f({ gamepad })), handlers };
  const nav = { getGamepads: () => list.current };
  return { win, nav, raf: (f) => frames.push(f), frames, handlers };
}

test('standard mapping: positional names, analog triggers, deadzoned sticks', () => {
  const s = readPad(pad({ buttons: btns(17, { 0: 1, 6: 0.4, 12: 1 }), axes: [0.05, -1, 0.5, 0.2] }));
  assert.equal(s.standard, true);
  assert.deepEqual(Object.keys(s.buttons), STANDARD_BUTTONS);
  assert.equal(s.buttons.south.pressed, true);
  assert.equal(s.buttons.up.pressed, true);
  assert.equal(s.buttons.lt.value, 0.4); assert.equal(s.buttons.lt.pressed, false);
  assert.equal(s.axes.lx, 0, 'inside the deadzone');
  assert.equal(s.axes.ly, -1);
  const v = toView(s);
  assert.deepEqual(v.pressed.sort(), ['south', 'up']);
  assert.equal(v.values.lt, 0.4); assert.deepEqual(v.sticks.r, [0.5, 0.2]);
});

test('every standard-mapping family reads the same way (Xbox, PlayStation, 8BitDo, generic)', () => {
  for (const id of ['Xbox Wireless Controller (Vendor: 045e)', 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', '8BitDo Pro 2 (Vendor: 2dc8)', 'USB Gamepad (Vendor: 0079 Product: 0011)']) {
    const s = readPad(pad({ id, buttons: btns(17, { 1: 1 }) }));
    assert.equal(s.buttons.east.pressed, true, id);
  }
  assert.equal(padFamily('DualSense Wireless Controller'), 'playstation');
  assert.equal(padFamily('8BitDo Ultimate'), '8bitdo');
  assert.equal(padFamily('Xbox 360 Controller'), 'xbox');
  assert.equal(padFamily('Harmonix Guitar for Xbox 360'), 'guitar');
  assert.equal(padFamily('Generic USB Joystick'), 'generic');
});

test('a non-standard mapping falls back to raw buttons and axes, never guesses', () => {
  const s = readPad({ index: 2, id: 'Weird HID pad', mapping: '', buttons: [1, 0, { pressed: true, value: 1 }], axes: [0.9, -0.03, 2] });
  assert.equal(s.standard, false);
  assert.deepEqual(Object.keys(s.buttons), ['b0', 'b1', 'b2']);
  assert.equal(s.buttons.b0.pressed, true); assert.equal(s.buttons.b2.pressed, true);
  assert.equal(s.axes.a2, 1, 'clamped'); assert.equal(s.axes.a1, 0, 'deadzoned');
  const v = toView(s);
  assert.equal(v.standard, false); assert.equal(v.raw.buttons.length, 3);
});

test('junk never throws: null pad, missing arrays, NaN axes, a throwing getGamepads', () => {
  assert.equal(readPad(null), null);
  const s = readPad({ id: 'x', mapping: 'standard' });
  assert.equal(s.buttons.south.pressed, false);
  assert.equal(readPad(pad({ axes: [NaN, Infinity, -5, undefined] })).axes.ly, 0);
  const hub = createGamepadHub({ nav: { getGamepads: () => { throw new Error('denied'); } }, win: null, raf: () => {} });
  assert.deepEqual(hub.poll(), []);
  assert.equal(createGamepadHub({ nav: {}, win: null, raf: () => {} }).supported, false);
});

test('hub: several pads by index, connect and disconnect from polling', () => {
  const list = { current: [pad({ index: 0 }), null, pad({ index: 2, id: 'DualSense Wireless Controller', buttons: btns(17, { 3: 1 }) })] };
  const env = mockEnv(list); const hub = createGamepadHub(env); const ev = [];
  hub.on((t, p) => ev.push(t + ':' + p.index));
  hub.poll();
  assert.deepEqual(hub.all().map((p) => p.index), [0, 2]);
  assert.equal(hub.get(2).buttons.north.pressed, true);
  assert.equal(hub.get(2).family, 'playstation');
  list.current = [null, null, list.current[2]];
  hub.poll();
  assert.deepEqual(ev, ['connect:0', 'connect:2', 'disconnect:0']);
  assert.equal(hub.first().index, 2);
});

test('hub: gamepadconnected / gamepaddisconnected events, subscribe starts and stops the loop', () => {
  const list = { current: [] }; const env = mockEnv(list); const hub = createGamepadHub(env); const ev = [], seen = [];
  hub.on((t, p) => ev.push(t + ':' + p.index));
  const off = hub.subscribe((all) => seen.push(all.length));
  assert.equal(env.handlers.gamepadconnected.length, 1);
  assert.equal(env.frames.length, 0, 'no pad connected: no animation frame is asked for');
  const g = pad({ index: 1 }); env.win.fire('gamepadconnected', g); list.current = [null, g];
  env.frames.shift()(); // one frame
  assert.equal(seen.at(-1), 1);
  env.win.fire('gamepaddisconnected', g); list.current = [];
  assert.deepEqual(ev, ['connect:1', 'disconnect:1']);
  env.frames.shift()(); assert.equal(env.frames.length, 0, 'the last pad gone: the loop stops asking for frames');
  off();
  assert.equal(env.handlers.gamepadconnected.length, 0, 'listeners removed when the last subscriber leaves');
});

test('art: every standard control drawn once, inside the viewBox', () => {
  const svg = padSVG({ uid: 't' });
  for (const n of STANDARD_BUTTONS) assert.ok(svg.includes(`data-btn="${n}"`), n);
  const [x0, y0, w, h] = PAD_VIEWBOX;
  for (const [k, g] of Object.entries(GEO)) { const rx = g.r ?? g.w / 2, ry = g.r ?? g.h / 2; assert.ok(g.x - rx >= x0 && g.x + rx <= x0 + w && g.y - ry >= y0 && g.y + ry <= y0 + h, k); }
  for (const set of GLYPH_SETS) assert.ok(padSVG({ glyphs: set }).includes(`data-glyphs="${set}"`));
  const gt = guitarSVG(); FRETS.forEach((c, i) => assert.ok(gt.includes(`data-btn="fret${i + 1}"`) && gt.includes(`fr-${c}`)));
});

test('art: no maker marks or maker symbols', () => {
  const all = padSVG({ glyphs: 'letters' }) + padSVG({ glyphs: 'shapes' }) + padSVG({ glyphs: 'numbers' }) + guitarSVG();
  assert.ok(!/xbox|playstation|dualsense|nintendo|sony|microsoft/i.test(all));
  assert.ok(!/[\u25cb\u2715\u25a1\u25b3\u00d7]/.test(all), 'no PlayStation-style cross / circle / square / triangle characters');
  assert.ok(!Object.values(GLYPHS.shapes).includes('cross'), 'the shapes set has no cross');
});

/* ---- replay input source ---- */
import { createReplay, syncReplayToMedia, CAR_BALL_DEFAULT } from '../gamepad-replay.mjs';
import { readFileSync } from 'node:fs';
const goal = JSON.parse(readFileSync(new URL('../replays/air-dribble.json', import.meta.url), 'utf8'));

test('replay: car-ball default mapping', () => {
  const m = (f) => CAR_BALL_DEFAULT.frame(f);
  assert.deepEqual(m({ throttle: 1 }).pressed, ['rt']);
  assert.equal(m({ throttle: 1 }).rt, 1);
  assert.deepEqual(m({ throttle: -1 }).pressed, ['lt']);
  assert.equal(m({ throttle: -0.6 }).lt, 0.6);
  assert.equal(m({ steer: -0.4 }).lx, -0.4);
  assert.equal(m({ steer: 9 }).lx, 1, 'clamped');
  for (const k of ['jump', 'doubleJump', 'dodge']) assert.deepEqual(m({ [k]: true }).pressed, ['south'], k);
  assert.deepEqual(m({ boost: true }).pressed, ['east']);
  assert.deepEqual(m({ handbrake: true }).pressed, ['west']);
  assert.equal(m({}).ly, 0, 'pitch is not recorded, so ly stays 0');
  assert.ok(CAR_BALL_DEFAULT.notRecorded.some((s) => /air roll/.test(s)));
});

test('replay: at() boundaries, the 1.18 s jump, hold and events', () => {
  const r = createReplay(goal.frames, { hold: 0 });
  assert.ok(r.frames.length > 150 && r.duration > 6.5);
  assert.deepEqual(r.at(r.start - 1).pressed, [], 'before the first frame: nothing');
  assert.equal(r.at(r.start - 1).frame, null);
  assert.ok(r.at(1.18).pressed.includes('south'), 'jump on the wall-pop frame (float sum 0.375357+0.804643)');
  assert.ok(r.at(0.375357 + 0.804643).pressed.includes('south'));
  assert.ok(!r.at(1.17).pressed.includes('south'), 'not a frame early');
  const first = (b) => r.events.find((e) => e.button === b)?.t;
  assert.equal(first('south'), 1.18);
  assert.equal(first('east'), 1.49);
  assert.equal(first('west'), 2.22);
  assert.ok(r.at(r.start + r.duration + 5).frame, 'after the end: holds the last frame');
  const h = createReplay(goal.frames, { hold: 0.15 });
  const j = r.frames.findIndex((f) => f.t === 1.18), next = r.frames[j + 1].t;
  assert.ok(h.at(next).pressed.includes('south'), 'hold keeps a one-frame jump visible');
  assert.ok(!h.at(1.18 + 0.2).pressed.includes('south') || r.at(1.38).pressed.includes('south'));
});

test('replay: junk frames and a throwing map never throw', () => {
  assert.doesNotThrow(() => createReplay(null).at(1));
  assert.equal(createReplay([]).duration, 0);
  const r = createReplay([{ t: 'x' }, null, { t: 0, throttle: 'NaN' }, { t: 1, steer: Infinity }, 7]);
  assert.equal(r.frames.length, 2);
  assert.equal(r.at(0).rt, 0);
  const bad = createReplay([{ t: 0 }, { t: 1 }], { map: () => { throw new Error('boom'); } });
  assert.deepEqual(bad.at(0.5).pressed, []);
  assert.ok(createReplay({ frames: [{ time: 2, boost: 1 }] }, { timeKey: 'time' }).at(2).pressed.includes('east'));
});

test('replay: syncReplayToMedia follows a (fake) video and stops cleanly', () => {
  const r = createReplay(goal.frames);
  const ls = {}; const cbs = [];
  const media = { currentTime: 0, addEventListener: (k, f) => (ls[k] = f), removeEventListener: (k) => delete ls[k], requestVideoFrameCallback: (f) => cbs.push(f), cancelVideoFrameCallback() {} };
  const seen = []; const target = { set state(s) { seen.push(s); } };
  const stop = syncReplayToMedia(r, media, target, { offset: 1.18 - 0.375357 });
  media.currentTime = 0.375357; ls.seeked();
  assert.ok(seen.at(-1).pressed.includes('south'), 'clip wall-pop frame shows the jump');
  cbs.shift()(0, { mediaTime: 6.0869 });
  assert.ok(seen.at(-1).frame.t >= 6.88 - 1e-6, 'first explosion frame is at/after the goal frame');
  stop();
  assert.equal(Object.keys(ls).length, 0, 'listeners removed');
});
