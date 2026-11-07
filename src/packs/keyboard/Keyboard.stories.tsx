import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyPrompt } from "./Keyboard";
import { createKeyReplay } from "./tk-keyboard.mjs";
import run from "./replays/sample-run.json";

/* Figma: Packs · Keyboard. `onion` names the Figma component a story is compared with
   (the toolbar's Figma and Onion buttons, and tools/onion-check.mjs via figma/onion.json). */
const onion = (component: string) => ({ component, skin: () => "default.png" });
const row = { display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" } as const;
const cap = { font: "600 12px/1.4 system-ui, sans-serif", marginTop: 6, color: "#d8d4e4" } as const;
const dark = { background: "#07060a", padding: 24, borderRadius: 12 } as const;
const THEMES = ["boosty", "dark", "light"] as const;
const CODES = ["KeyQ", "KeyW", "KeyE", "KeyA", "KeyS", "KeyD", "KeyF", "KeyR", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "Space", "ShiftLeft", "ControlLeft", "Tab", "Escape", "Enter", "Digit1", "Digit2", "F1"];

const meta: Meta<typeof Keyboard> = {
  title: "10 Packs/02 Keyboard",
  component: Keyboard,
  args: { keys: "wasd arrows space shift", theme: "boosty", highlight: "", pulse: false, calm: false, size: 1, layout: "auto", label: "", status: false, capture: false },
  argTypes: {
    keys: { control: "select", options: ["wasd arrows space shift", "wasd", "arrows", "wasd space shift ctrl", "esc fkeys numbers", "tab ctrl enter", "numbers9", "wasd KeyF KeyR space", "esc tab shift ctrl space enter arrows"] },
    theme: { control: "inline-radio", options: [...THEMES] },
    highlight: { control: "select", options: ["", "KeyW", "KeyW Space", "wasd", "arrows", "Space", "ShiftLeft", "KeyE"] },
    pulse: { control: "boolean" },
    calm: { control: "boolean" },
    size: { control: { type: "range", min: 0.3, max: 1.5, step: 0.05 } },
    source: { control: "inline-radio", options: ["none", "live", "replay"], mapping: { none: undefined } },
    capture: { control: "boolean", description: "With source=\"live\": also read keys typed in fields." },
    layout: { control: "inline-radio", options: ["auto", "us"] },
    labels: { control: "object", description: "Your own cap letters by code, e.g. { \"KeyW\": \"z\" }." },
    label: { control: "text" },
    status: { control: "boolean" },
    state: { control: "object" },
    replay: { control: false },
    currentTime: { control: { type: "number", min: 0, step: 0.05 } },
    onKey: { action: "tk-keyboard-key" },
  },
  parameters: { onion: onion("Keyboard"), backgrounds: { default: "dark" }, docs: { description: { component: "A keyboard drawn from tokens, only the keys a game uses, each where it sits on an ANSI board: named clusters (wasd, arrows, space, shift, ctrl, alt, tab, esc, enter, numbers, numbers9, fkeys) or any KeyboardEvent.code. Three themes, live keydown / keyup by position or a replay. Figma: [Packs · Keyboard → Keyboard](https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=561-1503) (Theme × Keys × State), [KeyPrompt](https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=562-177). Code Connect templates: figma/connect/keyboard/*.figma.ts. Tests: npm run test:keyboard." } } },
  decorators: [(S, ctx) => (ctx.parameters.bare ? <S /> : <div style={dark}><S /></div>)],
};
export default meta;
type Story = StoryObj<typeof Keyboard>;

/* The doc page: what the pack is, its API, and where its Figma and tests are. */
const link = { color: "#7fe9f2" } as const;
export const ReadMe: Story = {
  name: "Read me",
  parameters: { controls: { disable: true } },
  render: () => (
    <article style={{ color: "#ece8f6", font: "14px/1.55 system-ui, sans-serif", maxWidth: "68ch" }}>
      <h1 style={{ font: "800 24px/1.2 system-ui, sans-serif", margin: "0 0 8px" }}>Keyboard pack</h1>
      <p>A keyboard drawn from tokens, showing only the keys a game uses, with no maker's logo, legend font or colourway. Keys are named by <code>KeyboardEvent.code</code>, which is positional: <code>KeyW</code> is the key under the left hand's middle finger on every layout, so WASD is WASD on AZERTY too, and the cap shows the layout's own letter where the browser offers it.</p>
      <ul>
        <li><code>&lt;tk-keyboard&gt;</code>: <code>keys</code> clusters and codes (default <code>wasd arrows space shift</code>); <code>theme</code> boosty, dark or light; <code>highlight</code>, <code>pulse</code>, <code>calm</code>, <code>size</code>, <code>label</code>, <code>status</code>, <code>layout</code>; <code>source="live"</code> with <code>capture</code>, or <code>source="replay"</code>.</li>
        <li><code>&lt;tk-key-prompt&gt;</code>: "[W] Move forward" chips, <code>key</code>, <code>action</code>, <code>label</code>, <code>lit</code> and <code>pulse</code>.</li>
        <li>React: <code>Keyboard</code>, <code>KeyPrompt</code> (its <code>code</code> prop is the element's <code>key</code>) from <code>src/packs/keyboard</code>.</li>
      </ul>
      <p>Live input reads codes only, never the typed character, and sends nothing anywhere. Typing in a field is ignored unless <code>capture</code> is set; every key is let go on blur and when the page is hidden, so nothing sticks. Key presses are never announced.</p>
      <p>A held key is filled, outlined and sunk, not only recoloured. Pulsing stops under reduced motion, <code>calm</code> and the kit's motion pause.</p>
      <p>Figma: <a style={link} href="https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=561-1503">Keyboard</a> (Theme × Keys × State) and <a style={link} href="https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=562-177">KeyPrompt</a> on the Packs · Keyboard page. Code Connect templates: <code>figma/connect/keyboard</code>. Tests: <code>npm run test:keyboard</code>.</p>
    </article>
  ),
};

export const Playground: Story = {};

export const Themes: Story = {
  render: (a) => <div style={row}>{THEMES.map((t) => <div key={t}><Keyboard {...a} theme={t} size={0.7} state={{ pressed: ["KeyW", "ShiftLeft"] }} /><div style={cap}>{t}</div></div>)}</div>,
};

const SETS = ["wasd arrows space shift", "wasd", "arrows", "esc fkeys numbers", "tab ctrl enter", "numbers9", "wasd KeyF KeyR KeyG space", "esc tab shift ctrl space enter"];
export const Clusters: Story = {
  parameters: { docs: { description: { story: "Each keys value draws only those keys, at their ANSI positions on one deck; the arrows keep their own group to the right." } } },
  render: (a) => <div style={row}>{SETS.map((k) => <div key={k}><Keyboard {...a} keys={k} size={0.6} /><div style={cap}>{k}</div></div>)}</div>,
};

export const Idle: Story = { args: { state: { pressed: [] } } };
export const Held: Story = { args: { state: { pressed: ["KeyW", "ShiftLeft", "Space"] } }, parameters: { docs: { description: { story: "A held key is filled, outlined and sinks two units: status is never colour alone." } } } };
export const Highlight: Story = { args: { highlight: "KeyW Space" }, parameters: { docs: { description: { story: "A steady ring outside the cap, as a HUD uses for \"W: Move forward\". Fades in over 250 ms." } } } };
export const HighlightCluster: Story = { name: "Highlight: a whole cluster", args: { highlight: "arrows" } };
export const Pulse: Story = { args: { highlight: "KeyE", keys: "wasd KeyE space", pulse: true }, parameters: { docs: { description: { story: "Slow breathing (1.6 s), off under prefers-reduced-motion, calm or the kit's motion pause." } } } };
export const Calm: Story = { args: { highlight: "KeyE", keys: "wasd KeyE space", pulse: true, calm: true } };
export const Sizes: Story = { render: (a) => <div style={row}>{[0.35, 0.5, 0.75, 1].map((s) => <Keyboard key={s} {...a} size={s} highlight="KeyW" />)}</div> };

/* The same positions with a host's own letters: an AZERTY board's caps. */
const AZERTY = { KeyQ: "a", KeyW: "z", KeyE: "e", KeyA: "q", KeyS: "s", KeyD: "d", Digit1: "&", Digit2: "é", Digit3: "\"", Digit4: "'" };
export const LayoutLetters: Story = {
  name: "Layout letters (AZERTY)",
  parameters: { docs: { description: { story: "Codes stay positional; only the letters change. Live, the letters come from navigator.keyboard.getLayoutMap() where the browser has it; a host can pass its own with `labels`." } } },
  render: (a) => <div style={row}><div><Keyboard {...a} keys="numbers wasd space" layout="us" size={0.75} highlight="KeyW" /><div style={cap}>US caps</div></div><div><Keyboard {...a} keys="numbers wasd space" labels={AZERTY} size={0.75} highlight="KeyW" label="Keyboard, AZERTY letters" /><div style={cap}>same positions, AZERTY letters</div></div></div>,
};

/* Live: keys under your hands. A field beside it shows typing ignored, and a second
   board with capture shows it read. Nothing is announced; the held codes are written
   out below in plain text (not a live region). */
function LiveDemo(a: Record<string, unknown>) {
  const [held, setHeld] = useState<string[]>([]);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p style={{ ...cap, margin: 0, fontSize: 13 }}>Click inside this story, then press keys. Codes are positional, so W, A, S and D light up on any layout.</p>
      <div style={row}>
        <div><Keyboard {...a} source="live" status onKey={(d) => setHeld(d.held)} /><div style={cap}>typing in fields ignored</div></div>
        <div><Keyboard {...a} source="live" capture size={0.5} label="Keyboard, reading fields too" /><div style={cap}>capture: fields included</div></div>
      </div>
      <label style={{ ...cap, display: "grid", gap: 6, maxWidth: 320 }}>A field (try typing here)
        <input type="text" style={{ font: "14px system-ui, sans-serif", padding: "6px 8px", borderRadius: 6, border: "1px solid #6f6880", background: "#14111b", color: "#f3efff" }} />
      </label>
      <p style={{ ...cap, margin: 0 }}>Held now: {held.length ? held.join(" ") : "none"}</p>
    </div>
  );
}
export const LiveKeys: Story = {
  name: "Live keys",
  parameters: { docs: { description: { story: "source=\"live\" listens to keydown / keyup on window by event.code. Only codes are read, never the typed character, and nothing is sent anywhere. Every key is released on blur and when the page is hidden. Each press and release fires tk-keyboard-key with { code, down, held, reason }." } } },
  render: (a) => <LiveDemo {...a} />,
};

export const PromptChips: Story = {
  name: "Prompt chips",
  parameters: { onion: onion("KeyPrompt") },
  render: () => (
    <div style={{ display: "grid", gap: 14 }}>
      {THEMES.map((t) => (
        <div key={t} style={{ ...row, gap: 8, padding: 12, borderRadius: 10, background: t === "light" ? "#eef0f4" : "transparent" }}>
          <KeyPrompt theme={t} code="KeyW" action="Move forward" />
          <KeyPrompt theme={t} code="KeyA" action="Strafe left" />
          <KeyPrompt theme={t} code="Space" action="Jump" lit />
          <KeyPrompt theme={t} code="ShiftLeft" action="Sprint" />
          <KeyPrompt theme={t} code="KeyE" action="Use" lit pulse />
          <KeyPrompt theme={t} code="ArrowUp" action="Look up" />
          <KeyPrompt theme={t} code="Escape" action="Pause" />
          <KeyPrompt theme={t} code="Digit1" action="Slot 1" />
          <KeyPrompt theme={t} code="Tab" />
          <KeyPrompt theme={t} code="Space" action="Jump" effect="hold for a jet hover" />
        </div>
      ))}
    </div>
  ),
};

/* One panel per component: KeyPrompt gets its own controls (the controls gate checks
   every prop has a control somewhere). */
export const PromptPlayground: StoryObj<typeof KeyPrompt> = {
  name: "Prompt chip: controls",
  parameters: { onion: onion("KeyPrompt") },
  args: { code: "KeyW", action: "Move forward", effect: "", label: "", theme: "boosty", lit: false, pulse: false, layout: "auto" },
  argTypes: {
    code: { control: "select", options: CODES, description: "The element's `key` attribute (KeyboardEvent.code)." },
    action: { control: "text" },
    effect: { control: "text", description: "What the press does, after the action (e.g. \"hold for a jet hover\"); empty for none." },
    label: { control: "text", description: "Accessible name of the key; defaults to e.g. \"W key\"." },
    theme: { control: "inline-radio", options: [...THEMES] },
    lit: { control: "boolean" },
    pulse: { control: "boolean" },
    layout: { control: "inline-radio", options: ["auto", "us"] },
    labels: { control: "object" },
  },
  render: (a: Parameters<typeof KeyPrompt>[0]) => <KeyPrompt {...a} label={a.label || undefined} />,
} as never;

/* Replay: a made-up run, keyed by position, drives the board and the chips. Nothing
   moves until Play is pressed, and the run's inputs are written out in words beside it. */
const CHIPS = [["KeyW", "Move forward"], ["ShiftLeft", "Sprint"], ["Space", "Jump"], ["KeyA", "Strafe left"], ["KeyD", "Strafe right"], ["KeyE", "Use"]] as const;
function ReplayDemo() {
  const replay = useRef(createKeyReplay(run.frames, { hold: 0.12 })).current;
  const [t, setT] = useState(1.45), [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let id = 0, t0 = 0; const d = replay.duration;
    const tick = (now: number) => { t0 ||= now; const s = (now - t0) / 1000; setT(Math.min(s, d)); if (s < d) id = requestAnimationFrame(tick); else setPlaying(false); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, replay]);
  const held = new Set(replay.at(t).pressed);
  const words = "Inputs in words: W from 0.2 s to 5.0 s; Shift (sprint) from 0.8 to 2.9 s; Space (jump) at 1.4 and 4.4 s; D (strafe right) from 2.3 to 3.3 s; A (strafe left) from 3.6 to 4.0 s; E (use) at 5.3 s.";
  return (
    <div data-motion-class="data" data-equivalent="#keys-words" style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <div style={{ ...row, gap: 16, alignItems: "center" }}>
        <Keyboard keys="wasd space shift" replay={replay} currentTime={t} status size={0.8} label="Keyboard replay: a made-up run" />
        <button type="button" onClick={() => { if (!playing) setT(0); setPlaying((p) => !p); }} style={{ font: "600 13px system-ui, sans-serif", padding: "6px 12px", borderRadius: 8, border: "1px solid #22e4f0", background: "#0a0810", color: "#f3efff", cursor: "pointer" }}>{playing ? "Stop inputs" : "Play inputs"}</button>
      </div>
      <div style={{ ...row, gap: 8 }}>{CHIPS.map(([c, a]) => <KeyPrompt key={c} code={c} action={a} lit={held.has(c)} />)}</div>
      <p id="keys-words" style={{ color: "#d8d4e4", font: "13px/1.5 system-ui, sans-serif", margin: 0, maxWidth: "70ch" }}>{words}</p>
    </div>
  );
}
export const ReplayRun: Story = {
  name: "Replay: a made-up run",
  parameters: { docs: { description: { story: `createKeyReplay(frames) plays recorded key states (${run.frames.length} frames) through the same view-state as live input; syncTo(video, { offset }) rides it on footage. The chips light from the same timeline.` } } },
  render: () => <ReplayDemo />,
};

/* The same replay, scrubbed by hand. */
function ReplayScrub() {
  const [t, setT] = useState(1.45);
  const replay = useRef(createKeyReplay(run.frames, { hold: 0.12 })).current;
  return <div style={{ maxWidth: "100%" }}><Keyboard keys="wasd space shift" replay={replay} currentTime={t} status size={0.8} /><input aria-label="Replay time" type="range" min={0} max={replay.duration} step={0.01} value={t} onChange={(e) => setT(+e.target.value)} style={{ width: "min(100%, 340px)", display: "block", marginTop: 8 }} /></div>;
}
export const ReplayScrubber: Story = { name: "Replay: scrub inputs", render: () => <ReplayScrub /> };

/* Onion skins: the default variant of each Figma component, drawn 1:1 with nothing around it,
   for the toolbar's Onion switch and tools/onion-check.mjs (figma/onion.json). US caps, so the
   letters match the drawing on any layout. */
export const OnionSkin: Story = {
  name: "Onion skin",
  args: { theme: "boosty", keys: "wasd arrows space shift", size: 1 },
  parameters: { bare: true, onion: { component: "Keyboard", target: "root", skin: () => "default.png" } },
  render: (a) => <Keyboard keys={a.keys} theme={a.theme} layout="us" size={1} />,
};
export const PromptOnionSkin: Story = {
  name: "Prompt onion skin",
  parameters: { bare: true, onion: { component: "KeyPrompt", target: "root", skin: () => "default.png" } },
  render: () => <KeyPrompt code="KeyW" action="Move forward" theme="boosty" layout="us" />,
};
