/* The replay overlay used by the demo page, the Storybook story and the MP4 render:
   a <tk-gamepad source="replay"> plus prompt chips for whatever is held right now. */
import { createReplay, ROCKET_LEAGUE_DEFAULT } from './gamepad-replay.mjs';
import './tk-gamepad.mjs';

/* Goal clip sync: replay jump at 1.18 s (clock 3:59) = clip frame 10 (pts 0.375 s), the
   wall pop. Checked: the replay's goal frame (t 6.88 s) lands at clip 6.075 s, the frame
   before the first explosion frame (6.087 s), inside one frame at 24.17 fps. */
export const GOAL_CLIP_OFFSET = 1.18 - 0.375357;

const SHORT = { letters: { south: 'A', east: 'B', west: 'X', rt: 'RT', lt: 'LT' }, numbers: { south: '1', east: '2', west: '3', rt: 'RT', lt: 'LT' }, shapes: { south: 'Bottom', east: 'Right', west: 'Left', rt: 'RT', lt: 'LT' } };
const CHIP_ORDER = ['south', 'east', 'west', 'rt', 'lt'];
/* What the left stick's X means depends on where the car is (Tony, 2026-11-02: "we'd probably read that as air roll
   not steer in the air"): on the ground it steers; in the air it yaws, or rolls if air roll is held, and replays don't
   record air roll, so the label says both. A car at rest sits about 17 uu up; walls are near x ±4096 and y ±5120. */
export function stickMeaning(pos) {
  if (!pos) return 'Steer';
  if (Math.abs(pos.x) > 3950 || Math.abs(pos.y) > 5000) return 'Steer (wall)';
  return pos.z > 60 ? 'Yaw or air roll' : 'Steer';
}
/* chips: 'full' shows every pill with its key and action; 'compact' (Tony, 2026-11-02: "we can collapse the button
   pills") shows each as its glyph alone, and the pill held right now opens to say what it does. */
export function mountReplayOverlay(host, data, { hold = 0.15, theme = 'boosty', size = '', glyphs = 'letters', title = 'GrampaYeetly · air dribble', chips: chipMode = 'full' } = {}) {
  const replay = createReplay(data.frames || data, { map: ROCKET_LEAGUE_DEFAULT, hold });
  host.classList.add('tk-replay-overlay');
  host.innerHTML = `
    <div class="ro-card" data-theme="${theme}">
      <div class="ro-head"><span class="ro-dot" aria-hidden="true"></span><span class="ro-title"></span><span class="ro-clock" aria-label="Game clock"></span></div>
      <tk-gamepad theme="${theme}" glyphs="${glyphs}"${size ? ` size="${size}"` : ''} label="Rocket League inputs from the replay"></tk-gamepad>
      <div class="ro-steer" aria-hidden="true"><span class="ro-steer-k">Steer</span><span class="ro-steer-bar"><i></i></span></div>
      <div class="ro-chips" data-mode="${chipMode}" aria-live="off"></div>
      <div class="ro-foot">Replays record throttle, the stick left and right, jump, boost and powerslide. In the air that stick yaws or air rolls, and air roll isn't recorded, so it can't say which. Pitch isn't recorded either.</div>
    </div>`;
  host.querySelector('.ro-title').textContent = title;
  const pad = host.querySelector('tk-gamepad'), chips = host.querySelector('.ro-chips'), clock = host.querySelector('.ro-clock'), steer = host.querySelector('.ro-steer-bar i'), steerK = host.querySelector('.ro-steer-k');
  pad.replay = replay;
  const chipEls = Object.fromEntries(CHIP_ORDER.map((b) => { const c = document.createElement('tk-button-prompt'); c.setAttribute('btn', b); c.setAttribute('glyphs', glyphs); c.setAttribute('theme', theme); if (chipMode === 'compact') c.setAttribute('terse', ''); else c.setAttribute('action', ROCKET_LEAGUE_DEFAULT.labels[b]); c.setAttribute('label', SHORT[glyphs]?.[b] ?? SHORT.letters[b]); chips.append(c); return [b, c]; }));
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function show(t) {
    pad.currentTime = t; const s = replay.at(replay.start + t); const on = new Set(s.pressed);
    for (const b of CHIP_ORDER) {
      const c = chipEls[b], lit = on.has(b);
      if (c.hasAttribute('lit') !== lit) {
        c.toggleAttribute('lit', lit);
        if (chipMode === 'compact') lit ? c.setAttribute('action', ROCKET_LEAGUE_DEFAULT.labels[b]) : c.removeAttribute('action');
      }
    }
    clock.textContent = s.frame ? fmt(s.frame.clock) : '';
    const meaning = stickMeaning(s.frame?.pos);
    if (steerK.textContent !== meaning) steerK.textContent = meaning;
    const x = s.lx || 0; steer.style.left = x < 0 ? `${50 + x * 50}%` : '50%'; steer.style.width = `${Math.abs(x) * 50}%`;
  }
  show(0);
  return { replay, pad, show, sync(video, offset = GOAL_CLIP_OFFSET) { let stop = false; const tick = () => { if (stop) return; show(video.currentTime + offset); video.requestVideoFrameCallback ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick); }; tick(); video.addEventListener('seeked', () => show(video.currentTime + offset)); return () => { stop = true; }; } };
}

export const REPLAY_OVERLAY_CSS = `
.tk-replay-overlay{font:600 13px/1.2 var(--tk-font-sans,system-ui,sans-serif);container-type:inline-size}
.ro-card{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;padding:12px 14px 10px;border-radius:18px;background:rgba(8,6,12,.72);border:1px solid rgba(34,228,240,.28);color:#efe9ff;backdrop-filter:blur(6px)}
.ro-card[data-theme=light]{background:rgba(255,255,255,.86);color:#1d2026;border-color:rgba(47,111,224,.3)}
.tk-replay-overlay tk-gamepad{--tk-gamepad-width:100%;display:block;width:100%}
.ro-head{display:flex;align-items:center;gap:8px;letter-spacing:.02em}
.ro-dot{width:8px;height:8px;border-radius:50%;background:#ff3fb4}
.ro-title{font-weight:800}.ro-clock{margin-left:auto;font-variant-numeric:tabular-nums;opacity:.8}
.ro-steer{display:flex;align-items:center;gap:8px;font-size:11px;opacity:.9}
.ro-steer-k{min-width:8.5em}
.ro-steer-bar{position:relative;flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.1)}
.ro-steer-bar::after{content:"";position:absolute;left:50%;top:-2px;width:1px;height:10px;background:currentColor;opacity:.4}
.ro-steer-bar i{position:absolute;top:0;height:100%;border-radius:3px;background:#22e4f0}
.ro-chips{display:flex;flex-wrap:wrap;gap:6px;max-width:100%}
.ro-chips[data-mode=compact]{gap:4px}
/* off chips stay readable (4.5:1): only the key dims */
.ro-chips tk-button-prompt:not([lit]){--tk-gamepad-chip-key:#6b6878}
.ro-foot{font-size:10.5px;font-weight:500;opacity:.6;max-width:34em}
@media (prefers-reduced-motion:reduce){.ro-chips tk-button-prompt{transition:none}}
/* The card sizes itself to the room it's given (Tony, 2026-11-02: "the replay is taking over the entire storybook"):
   narrow, it drops the note and tightens; narrower, it keeps only the pad and the clock, so it never covers the clip. */
@container (max-width:300px){.ro-foot{display:none}.ro-card{gap:5px;padding:8px 10px 8px;border-radius:12px}.ro-head{font-size:11px}.ro-chips{gap:3px}}
@container (max-width:200px){.ro-chips,.ro-steer,.ro-title{display:none}.ro-card{padding:6px 8px}}
`;
