import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { Gamepad, ButtonPrompt, Guitar } from "./Gamepad";
import { createReplay, ROCKET_LEAGUE_DEFAULT, readPad } from "./tk-gamepad.mjs";
import { mountReplayOverlay, REPLAY_OVERLAY_CSS, GOAL_CLIP_OFFSET } from "./replay-overlay.mjs";
import goal from "./replays/grampayeetly-air-dribble.json";

/* Every story names its Figma component, so the toolbar's Figma button opens
   Packs · Gamepad in the TokenKit file (figma/keys.json). */
const onion = (component: string) => ({ component, skin: () => "default.png" });
const row = { display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" } as const;
const cap = { font: "600 12px/1.4 system-ui, sans-serif", opacity: 0.7, marginTop: 6 } as const;
const dark = { background: "#07060a", padding: 24, borderRadius: 12 } as const;

const meta: Meta<typeof Gamepad> = {
  title: "10 Packs/01 Gamepad",
  component: Gamepad,
  args: { theme: "boosty", glyphs: "letters", highlight: "", pulse: false, size: 1 },
  argTypes: {
    theme: { control: "inline-radio", options: ["boosty", "dark", "light"] },
    glyphs: { control: "inline-radio", options: ["letters", "shapes", "numbers"] },
    highlight: { control: "select", options: ["", "up", "down", "left", "right", "dpad", "south", "east", "west", "north", "lb", "rb", "lt", "rt", "ls", "rs", "view", "menu", "home"] },
  },
  parameters: { onion: onion("Gamepad"), backgrounds: { default: "dark" }, docs: { description: { component: "A modern dual-stick pad drawn from tokens: positional names (south/east/west/north, lb/rb/lt/rt, view/menu, ls/rs, d-pad, home), three themes, three glyph sets, live Gamepad API or replay input. Figma: [Packs · Gamepad → Gamepad](https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-153) (Theme × Glyphs × State), [ButtonPrompt](https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-3149), [Guitar](https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-2962). Code Connect templates: figma/connect/gamepad/*.figma.ts. Tests: npm run test:gamepad." } } },
  decorators: [(S, ctx) => (ctx.parameters.bare ? <S /> : <div style={dark}><S /></div>)],
};
export default meta;
type Story = StoryObj<typeof Gamepad>;

/* The doc page: what the pack is, its API, and where its Figma and tests are. */
const link = { color: "#7fe9f2" } as const;
export const ReadMe: Story = {
  name: "Read me",
  parameters: { controls: { disable: true } },
  render: () => (
    <article style={{ color: "#ece8f6", font: "14px/1.55 system-ui, sans-serif", maxWidth: "68ch" }}>
      <h1 style={{ font: "800 24px/1.2 system-ui, sans-serif", margin: "0 0 8px" }}>Gamepad pack</h1>
      <p>A modern dual-stick controller drawn from tokens, with no maker's logo, colours or symbols. Buttons use the Gamepad API's standard positional names, so one picture fits Xbox, PlayStation, 8BitDo and generic USB or Bluetooth pads.</p>
      <ul>
        <li><code>&lt;tk-gamepad&gt;</code>: <code>theme</code> boosty, dark or light; <code>glyphs</code> letters, shapes or numbers; <code>highlight</code>, <code>pulse</code>, <code>calm</code>, <code>size</code>, <code>label</code>, <code>status</code>; <code>source="live"</code> with <code>index</code>, or <code>source="replay"</code>.</li>
        <li><code>&lt;tk-button-prompt&gt;</code>: "D-pad up: Fetch" chips, <code>lit</code> and <code>pulse</code>, <code>terse</code> for glyph and action only.</li>
        <li><code>&lt;tk-guitar&gt;</code>: a 5-fret guitar glyph for jam and duo modes.</li>
        <li>React: <code>Gamepad</code>, <code>ButtonPrompt</code>, <code>Guitar</code> from <code>src/packs/gamepad</code>.</li>
      </ul>
      <p>A pad that doesn't report the standard mapping is shown as a list of raw buttons, never guessed at. Pulsing stops under reduced motion, <code>calm</code> and the kit's motion pause.</p>
      <p>Replays: Rocket League replays don't record pitch, yaw or air roll, so the left stick's Y axis and air roll can't be shown from one.</p>
      <p>Figma: <a style={link} href="https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-153">Gamepad</a>, <a style={link} href="https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-3149">ButtonPrompt</a>, <a style={link} href="https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-2962">Guitar</a> on the Packs · Gamepad page. Code Connect templates: <code>figma/connect/gamepad</code>. Tests: <code>npm run test:gamepad</code>.</p>
    </article>
  ),
};

export const Playground: Story = {};

export const Themes: Story = {
  render: (a) => <div style={row}>{(["boosty", "dark", "light"] as const).map((t) => <div key={t}><Gamepad {...a} theme={t} size={0.9} /><div style={{ ...cap, color: "#eee" }}>{t}</div></div>)}</div>,
};

export const GlyphSets: Story = {
  name: "Glyph sets",
  render: (a) => <div style={row}>{(["letters", "shapes", "numbers"] as const).map((g) => <div key={g}><Gamepad {...a} glyphs={g} size={0.9} /><div style={{ ...cap, color: "#eee" }}>{g}</div></div>)}</div>,
};

export const Idle: Story = { args: { state: { pressed: [] } } };
export const Pressed: Story = { args: { state: { pressed: ["south", "up", "rb"] } }, parameters: { docs: { description: { story: "Held buttons take the down colour and sink a little." } } } };
export const Analog: Story = { args: { state: { pressed: [], lt: 0.35, rt: 0.9, lx: -0.8, ly: 0.2, rx: 0.4, ry: -0.6 } }, parameters: { docs: { description: { story: "Triggers fill by value; stick caps travel with the axes." } } } };
export const Highlight: Story = { args: { highlight: "up" }, parameters: { docs: { description: { story: "A steady outline, as the HUD uses for \"D-pad up: Fetch\". Fades in over 250 ms." } } } };
export const HighlightDpad: Story = { name: "Highlight: whole d-pad", args: { highlight: "dpad" } };
export const Pulse: Story = { args: { highlight: "south", pulse: true }, parameters: { docs: { description: { story: "Slow breathing (1.6 s), off under prefers-reduced-motion or calm." } } } };
export const Calm: Story = { args: { highlight: "south", pulse: true, calm: true } };
export const Sizes: Story = { render: (a) => <div style={row}>{[0.4, 0.7, 1, 1.4].map((s) => <Gamepad key={s} {...a} size={s} highlight="up" />)}</div> };

/* A pad whose mapping is not "standard": the element shows its raw buttons, never guesses. */
function NonStandardDemo(a: Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector("tk-gamepad") as (HTMLElement & { state: unknown }) | null;
    const b = (on: boolean) => ({ pressed: on, value: on ? 1 : 0 });
    if (el) el.state = readPad({ id: "Generic USB HID pad (Vendor: 0079 Product: 0006)", mapping: "", index: 0, connected: true, buttons: [b(true), b(false), b(true), b(false), b(false), b(false), b(false), b(false), b(false), b(false)], axes: [0.5, 0, 0, 0] });
  }, []);
  return <div ref={ref}><Gamepad {...a} /></div>;
}
export const NonStandard: Story = { name: "Non-standard mapping (raw)", render: (a) => <NonStandardDemo {...a} /> };

export const LivePad: Story = {
  name: "Live pad",
  args: { source: "live", status: true },
  parameters: { docs: { description: { story: "Plug in or pair any standard-mapping pad (Xbox, PlayStation, 8BitDo, generic USB/Bluetooth) and press a button: browsers only expose a pad after a press. Pads are read by index; connect and disconnect fire tk-gamepad-connect / tk-gamepad-disconnect. A pad without the standard mapping shows its raw buttons." } } },
  render: (a) => (
    <div style={row}>
      <div><Gamepad {...a} label="First connected pad" /><div style={{ ...cap, color: "#eee" }}>first pad</div></div>
      {[0, 1, 2, 3].map((i) => <div key={i}><Gamepad {...a} index={i} size={0.45} label={`Pad ${i + 1}`} /><div style={{ ...cap, color: "#eee" }}>index {i}</div></div>)}
    </div>
  ),
};

export const PromptChips: Story = {
  name: "Prompt chips",
  parameters: { onion: onion("ButtonPrompt") },
  render: () => (
    <div style={{ display: "grid", gap: 14 }}>
      {(["boosty", "dark", "light"] as const).map((t) => (
        <div key={t} style={{ ...row, gap: 8, padding: 12, borderRadius: 10, background: t === "light" ? "#eef0f4" : "transparent" }}>
          <ButtonPrompt theme={t} btn="up" action="Fetch" />
          <ButtonPrompt theme={t} btn="down" action="Sit" />
          <ButtonPrompt theme={t} btn="left" action="Spin" />
          <ButtonPrompt theme={t} btn="right" action="Bark" lit />
          <ButtonPrompt theme={t} btn="south" action="Jump" terse />
          <ButtonPrompt theme={t} btn="east" action="Boost" glyphs="shapes" />
          <ButtonPrompt theme={t} btn="west" action="Grab" glyphs="numbers" />
          <ButtonPrompt theme={t} btn="rt" action="Drive" />
          <ButtonPrompt theme={t} btn="lb" action="Camera" />
          <ButtonPrompt theme={t} btn="ls" action="Walk" />
          <ButtonPrompt theme={t} btn="menu" action="Pause" lit pulse />
        </div>
      ))}
    </div>
  ),
};

export const GuitarGlyph: Story = {
  name: "Guitar (jam / duo)",
  parameters: { onion: onion("Guitar") },
  render: () => <div style={row}>{(["boosty", "dark", "light"] as const).map((t) => <Guitar key={t} theme={t} size={1.4} pressed={["fret1", "fret3"]} highlight="strum" />)}<ButtonPrompt btn="fret2" action="Bass note" /></div>,
};

/* One panel per component: ButtonPrompt and Guitar get their own controls
   (the controls gate checks every prop has a control somewhere). */
const PADS = ["up", "down", "left", "right", "south", "east", "west", "north", "lb", "rb", "lt", "rt", "ls", "rs", "view", "menu", "home"];
const FRET_BTNS = ["fret1", "fret2", "fret3", "fret4", "fret5", "strum", "whammy"];
export const PromptPlayground: StoryObj<typeof ButtonPrompt> = {
  name: "Prompt chip: controls",
  parameters: { onion: onion("ButtonPrompt") },
  args: { btn: "up", action: "Fetch", label: "", glyphs: "letters", theme: "boosty", lit: false, pulse: false, terse: false },
  argTypes: {
    btn: { control: "select", options: [...PADS, "fret1", "fret2", "fret3", "fret4", "fret5", "strum"] },
    action: { control: "text" },
    label: { control: "text", description: "Accessible name; defaults to \"<button>: <action>\"." },
    glyphs: { control: "inline-radio", options: ["letters", "shapes", "numbers"] },
    theme: { control: "inline-radio", options: ["boosty", "dark", "light"] },
    lit: { control: "boolean" },
    pulse: { control: "boolean" },
    terse: { control: "boolean", description: "Glyph only, no action word." },
  },
  render: (a: Parameters<typeof ButtonPrompt>[0]) => <ButtonPrompt {...a} label={a.label || undefined} />,
} as never;
export const GuitarPlayground: StoryObj<typeof Guitar> = {
  name: "Guitar: controls",
  parameters: { onion: onion("Guitar") },
  args: { theme: "boosty", size: 1.4, highlight: "strum", pressed: ["fret1", "fret3"], label: "Guitar controller" },
  argTypes: {
    theme: { control: "inline-radio", options: ["boosty", "dark", "light"] },
    size: { control: { type: "range", min: 0.4, max: 3, step: 0.1 } },
    highlight: { control: "select", options: ["", ...FRET_BTNS] },
    pressed: { control: "check", options: FRET_BTNS },
    label: { control: "text" },
  },
  render: (a: Parameters<typeof Guitar>[0]) => <Guitar {...a} highlight={a.highlight || undefined} />,
} as never;


/* Replay: inputs recorded in a Rocket League replay drive the pad. The clip is Tony's and
   stays on this machine: Storybook serves demo/media only in dev (never in a build), and
   without it the inputs still play on their own clock. */
function ReplayDemo() {
  const host = useRef<HTMLDivElement>(null), video = useRef<HTMLVideoElement>(null);
  const ov = useRef<ReturnType<typeof mountReplayOverlay> | null>(null);
  const [clip, setClip] = useState(true), [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const st = document.createElement("style"); st.textContent = REPLAY_OVERLAY_CSS; document.head.append(st);
    ov.current = mountReplayOverlay(host.current, goal, { chips: "compact" });
    ov.current.show(1.18); // the wall pop, until someone presses play
    let stop: () => void = () => {};
    if (clip && video.current) stop = ov.current.sync(video.current, GOAL_CLIP_OFFSET); // follows the video only while it plays or seeks
    return () => { stop(); st.remove(); };
  }, [clip]);
  /* Without the clip: play the inputs on their own clock, once, when asked. */
  useEffect(() => {
    if (!playing || !ov.current) return;
    let id = 0, t0 = 0; const d = ov.current.replay.duration;
    const tick = (now: number) => { t0 ||= now; const t = (now - t0) / 1000; ov.current?.show(Math.min(t, d)); if (t < d) id = requestAnimationFrame(tick); else setPlaying(false); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);
  const words = "Inputs in words: throttle from 0.17 s; jump at 1.18 s (the wall pop, clock 3:59); boost at 1.49, 1.98, 3.02 and 3.30 s; powerslide at 2.22 s; throttle again at 5.07 s; goal at 6.88 s (clock 3:53).";
  return (
    <div data-motion-class="data" data-equivalent="#replay-words" style={{ width: "min(100%, 960px)" }}>
      <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#000", borderRadius: 12, overflow: "hidden" }}>
        {clip
          ? <video ref={video} src="/local-media/goal.mp4" controls playsInline muted aria-label="GrampaYeetly air dribble goal (local clip)" style={{ width: "100%", height: "100%", display: "block" }} onError={() => setClip(false)} />
          : <div style={{ position: "absolute", top: 16, right: 16, display: "grid", gap: 8, justifyItems: "end", color: "#d8d4e4", font: "13px/1.4 system-ui, sans-serif", textAlign: "right", maxWidth: "50%" }}>
              <span>The clip stays on Tony's machine, so it isn't served here. The inputs play on their own clock.</span>
              <button type="button" onClick={() => setPlaying((p) => !p)} style={{ font: "600 13px system-ui, sans-serif", padding: "6px 12px", borderRadius: 8, border: "1px solid #22e4f0", background: "#0a0810", color: "#f3efff", cursor: "pointer" }}>{playing ? "Stop inputs" : "Play inputs"}</button>
            </div>}
        <div ref={host} style={{ position: "absolute", left: "2%", bottom: "3%", width: "30%" }} />
      </div>
      <p id="replay-words" style={{ color: "#d8d4e4", font: "13px/1.5 system-ui, sans-serif", margin: "10px 0 0", maxWidth: "70ch" }}>{words}</p>
    </div>
  );
}
export const ReplayGoal: Story = {
  name: "Replay: GrampaYeetly air dribble",
  parameters: { docs: { description: { story: `Inputs from the match replay (${goal.frames.length} frames, ~30 Hz) on the Rocket League default layout: throttle → RT/LT, steer → left stick X, jump/double jump/dodge → A, boost → B, powerslide → X. Synced at the wall pop (replay 1.18 s, clock 3:59 = clip 0.375 s); the replay's goal frame lands on the first goal-explosion frame. Pitch, yaw and air roll are not stored in replays, so the left stick's Y axis and air roll cannot be shown.` } } },
  render: () => <ReplayDemo />,
};

/* The same replay with no clip: scrub it. */
function ReplayScrub() {
  const [t, setT] = useState(1.18);
  const replay = useRef(createReplay(goal.frames, { map: ROCKET_LEAGUE_DEFAULT, hold: 0.15 })).current;
  return <div><Gamepad replay={replay} currentTime={t} status /><input aria-label="Replay time" type="range" min={0} max={replay.duration} step={0.01} value={t} onChange={(e) => setT(+e.target.value)} style={{ width: 340, display: "block", marginTop: 8 }} /></div>;
}
export const ReplayScrubber: Story = { name: "Replay: scrub inputs", render: () => <ReplayScrub /> };

/* Onion skins: the default variant of each Figma component, drawn 1:1 with nothing around it,
   for the toolbar's Onion switch and tools/onion-check.mjs (figma/onion.json). */
export const OnionSkin: Story = {
  name: "Onion skin",
  args: { theme: "boosty", glyphs: "letters", size: 1 },
  parameters: { bare: true, onion: { component: "Gamepad", target: "root", skin: () => "default.png" } },
  render: (a) => <Gamepad theme={a.theme} glyphs={a.glyphs} size={1} />,
};
export const PromptOnionSkin: Story = {
  name: "Prompt onion skin",
  parameters: { bare: true, onion: { component: "ButtonPrompt", target: "root", skin: () => "default.png" } },
  render: () => <ButtonPrompt btn="south" action="Fetch" theme="boosty" terse />,
};
export const GuitarOnionSkin: Story = {
  name: "Guitar onion skin",
  parameters: { bare: true, onion: { component: "Guitar", target: "root", skin: () => "default.png" } },
  render: () => <Guitar theme="boosty" size={1} />,
};
