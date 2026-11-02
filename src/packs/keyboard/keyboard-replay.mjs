/* TokenKit keyboard pack: replay input source.
   A replay is a timeline of recorded key states (from a game's input log, a test, a
   demo) played through the same view-state live input produces, so <tk-keyboard> draws a
   recording exactly the way it draws the keys under your hands.

   frames: [{ t: seconds, keys: ['KeyW', 'ShiftLeft'] }] in time order, each the keys held
   from that moment until the next frame. Codes are KeyboardEvent.code, so a recording
   made on one layout plays back on the same positions on any other. A `map` turns any
   other frame shape (a game's own { forward, jump }) into { pressed: [codes] }. */

const codesOf = (f) => (Array.isArray(f?.keys) ? f.keys : Array.isArray(f?.pressed) ? f.pressed : []).filter((c) => typeof c === 'string' && c);
export const KEY_STATES = Object.freeze({ name: 'Key states', frame: (f) => ({ pressed: codesOf(f) }) });

/* createKeyReplay(frames, { map, hold }) -> { duration, start, at(t), events, frames }
   hold: keep a tap visible for at least this many seconds (a 30 ms tap is otherwise gone
   before the eye sees it). 0 = exactly as recorded. */
export function createKeyReplay(frames, { map = KEY_STATES, hold = 0, timeKey = 't' } = {}) {
  const fr = (Array.isArray(frames) ? frames : frames?.frames || []).filter((f) => f && typeof f === 'object' && Number.isFinite(+f[timeKey])).slice().sort((a, b) => a[timeKey] - b[timeKey]);
  const toState = typeof map === 'function' ? map : map.frame.bind(map);
  const states = fr.map((f) => { try { const s = toState(f) || {}; return { ...s, pressed: codesOf(s) }; } catch { return { pressed: [] }; } });
  const T = fr.map((f) => +f[timeKey]);
  const start = T.length ? T[0] : 0, duration = T.length ? T[T.length - 1] - start : 0;
  // press starts: when each key went down, for chips / captions / tests
  const events = [];
  states.forEach((s, i) => { const prev = new Set(i ? states[i - 1].pressed : []); for (const k of s.pressed) if (!prev.has(k)) events.push({ t: T[i], code: k, frame: fr[i] }); });
  const idx = (t) => { let lo = 0, hi = T.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (T[m] <= t + 1e-6) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
  function at(t) {
    const i = idx(t);
    if (i < 0) return { pressed: [], frame: null, t };
    const pressed = new Set(states[i].pressed);
    if (hold > 0) for (const e of events) { if (e.t > t + 1e-6) break; if (t - e.t < hold) pressed.add(e.code); }
    return { ...states[i], pressed: [...pressed], frame: fr[i], t };
  }
  return { frames: fr, start, duration, at, events, map };
}

/* Drive a target (anything with a `state` setter, e.g. <tk-keyboard>) from a media
   element. replayTime = media.currentTime + offset. Uses requestVideoFrameCallback when
   the browser has it (frame-exact), else requestAnimationFrame, and only while the
   media plays; a seek or time update draws once. Returns a stop function. */
export function syncKeysToMedia(replay, media, target, { offset = 0, onFrame } = {}) {
  let stopped = false, handle = 0, ticking = false;
  const raf = globalThis.requestAnimationFrame?.bind(globalThis), caf = globalThis.cancelAnimationFrame?.bind(globalThis);
  const useRVFC = typeof media.requestVideoFrameCallback === 'function';
  const draw = (mediaTime) => { const t = (mediaTime ?? media.currentTime) + offset; const s = replay.at(t); target.state = s; onFrame?.(s, t); };
  const next = () => { handle = useRVFC ? media.requestVideoFrameCallback(tick) : raf?.(tick); };
  const tick = (_now, meta) => { if (stopped) return; draw(meta?.mediaTime); if (media.paused || media.ended) { ticking = false; return; } next(); };
  const onPlay = () => { if (stopped || ticking) return; ticking = true; next(); };
  const onSeek = () => draw();
  media.addEventListener?.('seeked', onSeek); media.addEventListener?.('timeupdate', onSeek); media.addEventListener?.('play', onPlay);
  draw();
  if (media.paused === false) onPlay();
  return () => {
    stopped = true;
    media.removeEventListener?.('seeked', onSeek); media.removeEventListener?.('timeupdate', onSeek); media.removeEventListener?.('play', onPlay);
    if (useRVFC) media.cancelVideoFrameCallback?.(handle); else caf?.(handle);
  };
}
