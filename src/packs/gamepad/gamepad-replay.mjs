/* TokenKit gamepad pack: replay input source.
   A replay is a timeline of recorded frames (from a game's replay file, a test, a demo)
   played through the same view-state the live Gamepad API produces, so <tk-gamepad>
   draws a recording exactly the way it draws a pad in your hands.

   frames: [{ t: seconds, ...fields }] in time order. A mapping turns one frame into a
   view-state { pressed:[names], lt, rt, lx, ly, rx, ry } using standard positional names.

   Rocket League replays store the car's network-replicated inputs at about 30 Hz:
   throttle, steer, handbrake, and the boost / jump / double-jump / dodge components.
   They do NOT store pitch, yaw or air roll, so the right stick, the left stick's Y axis
   and the air-roll button cannot be shown from a replay. */

/* Rocket League default controller layout (positional names, any maker's pad):
   throttle > 0 = RT, throttle < 0 = LT (reverse/brake), steer = left stick X,
   jump / double jump / dodge = A (south), boost = B (east), handbrake = X (west). */
export const ROCKET_LEAGUE_DEFAULT = Object.freeze({
  name: 'Rocket League default',
  frame(f) {
    const th = num(f.throttle), st = num(f.steer), pressed = [];
    if (f.jump || f.doubleJump || f.dodge) pressed.push('south');
    if (f.boost) pressed.push('east');
    if (f.handbrake) pressed.push('west');
    if (th > 0.5) pressed.push('rt'); else if (th < -0.5) pressed.push('lt');
    return { pressed, rt: Math.max(0, th), lt: Math.max(0, -th), lx: st, ly: 0, rx: 0, ry: 0 };
  },
  labels: { south: 'Jump', east: 'Boost', west: 'Powerslide', rt: 'Throttle', lt: 'Reverse', ls: 'Steer' },
  notRecorded: ['pitch (left stick Y)', 'yaw in the air', 'air roll', 'right stick (camera)'],
});

const num = (v) => { const n = +v; return Number.isFinite(n) ? Math.max(-1, Math.min(1, n)) : 0; };

/* createReplay(frames, { map, hold }) -> { duration, start, at(t), events, frames }
   hold: keep a digital press visible for at least this many seconds (a one-frame jump at
   30 Hz is otherwise gone before the eye sees it). 0 = exactly as recorded. */
export function createReplay(frames, { map = ROCKET_LEAGUE_DEFAULT, hold = 0, timeKey = 't' } = {}) {
  const fr = (Array.isArray(frames) ? frames : frames?.frames || []).filter((f) => f && Number.isFinite(+f[timeKey])).slice().sort((a, b) => a[timeKey] - b[timeKey]);
  const toState = typeof map === 'function' ? map : map.frame.bind(map);
  const states = fr.map((f) => { try { return toState(f) || {}; } catch { return {}; } });
  const T = fr.map((f) => +f[timeKey]);
  const start = T.length ? T[0] : 0, duration = T.length ? T[T.length - 1] - start : 0;
  // press starts: when each button went down, for chips / captions / tests
  const events = [];
  states.forEach((s, i) => { const prev = new Set(i ? states[i - 1].pressed || [] : []); for (const b of s.pressed || []) if (!prev.has(b)) events.push({ t: T[i], button: b, frame: fr[i] }); });
  const idx = (t) => { let lo = 0, hi = T.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (T[m] <= t + 1e-6) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
  function at(t) {
    const i = idx(t);
    if (i < 0) return { pressed: [], lt: 0, rt: 0, lx: 0, ly: 0, rx: 0, ry: 0, frame: null, t };
    const s = states[i]; const pressed = new Set(s.pressed || []);
    if (hold > 0) for (const e of events) { if (e.t > t + 1e-6) break; if (t - e.t < hold) pressed.add(e.button); }
    return { ...s, pressed: [...pressed], frame: fr[i], t };
  }
  return { frames: fr, start, duration, at, events, map };
}

/* Drive a target (anything with a `state` setter, e.g. <tk-gamepad>) from a media element.
   replayTime = media.currentTime + offset. Uses requestVideoFrameCallback when the browser
   has it (frame-exact), else requestAnimationFrame. Returns a stop function. */
export function syncReplayToMedia(replay, media, target, { offset = 0, onFrame } = {}) {
  let stopped = false, handle = 0;
  const raf = globalThis.requestAnimationFrame?.bind(globalThis), caf = globalThis.cancelAnimationFrame?.bind(globalThis);
  const useRVFC = typeof media.requestVideoFrameCallback === 'function';
  const draw = (mediaTime) => { const t = (mediaTime ?? media.currentTime) + offset; const s = replay.at(t); target.state = s; onFrame?.(s, t); };
  const tick = (_now, meta) => { if (stopped) return; draw(meta?.mediaTime); handle = useRVFC ? media.requestVideoFrameCallback(tick) : raf(tick); };
  const onSeek = () => draw();
  media.addEventListener?.('seeked', onSeek); media.addEventListener?.('timeupdate', onSeek);
  draw(); handle = useRVFC ? media.requestVideoFrameCallback(tick) : raf?.(tick);
  return () => { stopped = true; media.removeEventListener?.('seeked', onSeek); media.removeEventListener?.('timeupdate', onSeek); if (useRVFC) media.cancelVideoFrameCallback?.(handle); else caf?.(handle); };
}
