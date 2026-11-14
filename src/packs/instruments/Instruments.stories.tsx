import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { GuitarNeck, PianoKeys } from "./Instruments";

const cap = { font: "600 12px/1.4 system-ui, sans-serif", opacity: 0.7, marginTop: 6 } as const;
const dark = { background: "#07060a", padding: 24, borderRadius: 12 } as const;

const meta: Meta<typeof GuitarNeck> = {
  title: "10 Packs/05 Instruments",
  component: GuitarNeck,
  parameters: { backgrounds: { default: "dark" }, docs: { description: { component: "Playable 3D instruments at true proportions, each note from real CC0 recordings: a six-string guitar neck and a 25 to 88 key piano, played by tap, drag, arrow keys, the computer keyboard or a gamepad. Tests: npm run test:instruments." } } },
  decorators: [(S) => <div style={dark}><S /></div>],
};
export default meta;
type Story = StoryObj<typeof GuitarNeck>;

/* The doc page: what the pack is, its API, and where its tests are. */
export const ReadMe: Story = {
  name: "Read me",
  parameters: { controls: { disable: true } },
  render: () => (
    <article style={{ color: "#ece8f6", font: "14px/1.55 system-ui, sans-serif", maxWidth: "68ch" }}>
      <h1 style={{ font: "800 24px/1.2 system-ui, sans-serif", margin: "0 0 8px" }}>Instruments pack</h1>
      <p>Playable 3D instruments modelled at true proportions. Every note plays from real recordings (CC0), never synthesis, and nothing is fetched until <code>sound</code> is on.</p>
      <ul>
        <li><code>&lt;tk-guitar-neck&gt;</code>: a playable 3D six-string neck. Every string and fret plays its note, by tap, drag, arrow keys or a 5-fret controller.</li>
        <li><code>&lt;tk-piano-keys&gt;</code>: a playable 3D keyboard, 25 to 88 keys. Every key plays its note, by tap, drag, arrow keys, the computer keyboard or a gamepad, with a sustain pedal.</li>
        <li>React: <code>GuitarNeck</code>, <code>PianoKeys</code> from <code>src/packs/instruments</code>.</li>
      </ul>
      <p>The guitar controller glyph (<code>&lt;tk-guitar&gt;</code>) and the gamepad stay in the gamepad pack. Motion stops under reduced motion, <code>calm</code> and the kit's motion pause. Tests: <code>npm run test:instruments</code>.</p>
    </article>
  ),
};

/* The 3D neck: every string and fret bound to its note in standard tuning, sounding real
   recordings. Click or drag across the strings, or focus it and use the arrow keys and
   Space. On the computer keyboard, hold 1 to 5 (the controller's fret1..5) and press
   S to strum what is held: the default binding is an A minor pentatonic box. */
const NECK_KEYS: Record<string, string> = { "1": "fret1", "2": "fret2", "3": "fret3", "4": "fret4", "5": "fret5", s: "strum", S: "strum" };
function PlayableNeck() {
  const [held, setHeld] = useState<string[]>([]);
  const [last, setLast] = useState("Play a string");
  useEffect(() => {
    const down = (e: KeyboardEvent) => { const b = NECK_KEYS[e.key]; if (!b || e.repeat) return; setHeld((h) => (h.includes(b) ? h : [...h, b])); };
    const up = (e: KeyboardEvent) => { const b = NECK_KEYS[e.key]; if (b) setHeld((h) => h.filter((x) => x !== b)); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  return (
    <div style={{ maxWidth: 980 }}>
      <GuitarNeck sound frets={12} pressed={held} highlight="s6f5 s6f8 s5f5 s5f7 s4f5" label="Guitar neck, A minor box" onNote={(n) => setLast(`${n.name}: string ${n.string}, ${n.fret ? "fret " + n.fret : "open"}, ${n.frequency.toFixed(1)} Hz`)} />
      <div style={{ ...cap, color: "#ece8f6" }}>{last}. Hold 1 to 5 and press S to strum the ringed box.</div>
    </div>
  );
}
export const GuitarNeck3D: Story = {
  name: "Guitar neck (3D, plays)",
  parameters: { controls: { disable: true }, docs: { description: { story: "A modelled neck at true proportions (25.5\" scale, 12\" radius). Every position plays its note from real recordings (CC0, Karoryfer)." } } },
  render: () => <PlayableNeck />,
};
const NECK_POS = ["s6f5", "s6f8", "s5f5", "s5f7", "s4f5", "s4f7", "s3f5", "s3f7", "s2f5", "s2f8", "s1f5", "s1f8", "s6f0", "s1f0", "s3f2", "s2f3", "s4f2"];
export const GuitarNeckPlayground: StoryObj<typeof GuitarNeck> = {
  name: "Guitar neck: controls",
  args: { frets: 12, highlight: "s6f5 s5f7", pulse: false, calm: false, sound: false, theme: "boosty", size: 1.4, label: "Guitar neck", pressed: ["s4f2", "s3f2", "s2f3"] },
  argTypes: {
    frets: { control: { type: "range", min: 5, max: 22, step: 1 } },
    highlight: { control: "text", description: "Space-separated positions to ring: s{string}f{fret}, string 1 high e .. 6 low E, fret 0 open." },
    pulse: { control: "boolean" },
    calm: { control: "boolean" },
    sound: { control: "boolean", description: "Play real recordings (fetches about 0.6 MB on first note)." },
    theme: { control: "inline-radio", options: ["boosty", "dark", "light"] },
    size: { control: { type: "range", min: 0.5, max: 2, step: 0.1 } },
    label: { control: "text" },
    pressed: { control: "check", options: NECK_POS },
    binding: { control: "object", description: "Controller button to position, e.g. { fret1: \"s6f5\" }. Default: an A minor pentatonic box at the 5th fret." },
    onNote: { action: "note" },
    className: { control: "text" },
    style: { control: "object" },
  },
  render: (a: Parameters<typeof GuitarNeck>[0]) => <GuitarNeck {...a} highlight={a.highlight || undefined} />,
} as never;

/* The 3D keyboard: every key bound to its note, sounding a real upright piano. Tap, hold
   or drag across the keys, or focus it and use the arrows and Space. On the computer
   keyboard, the home row plays C4 to C5 as on a music app (A S D F G H J K for the white
   keys, W E T Y U for the black) and Shift is the sustain pedal. */
const PIANO_CODES: Record<string, string> = { KeyA: "C4", KeyW: "C#4", KeyS: "D4", KeyE: "D#4", KeyD: "E4", KeyF: "F4", KeyT: "F#4", KeyG: "G4", KeyY: "G#4", KeyH: "A4", KeyU: "A#4", KeyJ: "B4", KeyK: "C5" };
function PlayableKeys() {
  const [held, setHeld] = useState<string[]>([]);
  const [sustain, setSustain] = useState(false);
  const [last, setLast] = useState("Play a key");
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") { setSustain(true); return; }
      const n = PIANO_CODES[e.code]; if (!n || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      setHeld((h) => (h.includes(n) ? h : [...h, n]));
    };
    const up = (e: KeyboardEvent) => { if (e.key === "Shift") setSustain(false); const n = PIANO_CODES[e.code]; if (n) setHeld((h) => h.filter((x) => x !== n)); };
    const blur = () => { setHeld([]); setSustain(false); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);
  return (
    <div style={{ maxWidth: 980 }}>
      <PianoKeys sound keys={25} pressed={held} sustain={sustain} highlight="C4 E4 G4" label="Piano keyboard, C major chord marked" onNote={(n) => setLast(`${n.name}, ${n.frequency.toFixed(1)} Hz`)} />
      <div style={{ ...cap, color: "#ece8f6" }}>{last}. A S D F G H J K play C4 to C5 (W E T Y U the black keys); hold Shift for the sustain pedal.{sustain ? " Pedal down." : ""}</div>
    </div>
  );
}
export const PianoKeys3D: Story = {
  name: "Piano keys (3D, plays)",
  parameters: { controls: { disable: true }, docs: { description: { story: "A modelled keyboard at true proportions (23.5 mm white keys, black keys spaced as a real piano spaces them). Every key plays its note from real recordings (CC0, FreePats Upright Piano KW)." } } },
  render: () => <PlayableKeys />,
};
const PIANO_NOTES = ["C3", "E3", "G3", "C4", "C#4", "D4", "E4", "F4", "F#4", "G4", "A4", "Bb4", "B4", "C5"];
export const PianoKeysPlayground: StoryObj<typeof PianoKeys> = {
  name: "Piano keys: controls",
  args: { keys: 25, range: "", highlight: "C4 E4 G4", pulse: false, calm: false, sound: false, theme: "boosty", size: 1.4, label: "Piano keyboard", pressed: ["C4", "E4", "G4"], sustain: false },
  argTypes: {
    keys: { control: "inline-radio", options: [25, 37, 49, 61, 76, 88] },
    range: { control: "text", description: "Any other span, white key to white key, e.g. \"F3-F5\"; wins over keys." },
    highlight: { control: "text", description: "Space-separated note names to mark with a dot, e.g. \"C4 E4 G4\"." },
    pulse: { control: "boolean" },
    calm: { control: "boolean" },
    sound: { control: "boolean", description: "Play real recordings (fetches the notes it needs, up to about 1.3 MB)." },
    theme: { control: "inline-radio", options: ["boosty", "dark", "light"] },
    size: { control: { type: "range", min: 0.5, max: 2, step: 0.1 } },
    label: { control: "text" },
    pressed: { control: "check", options: PIANO_NOTES },
    binding: { control: "object", description: "Gamepad button to note name or \"sustain\". Default: west C4, south D4, east E4, north G4, lb A4, rb C5, rt sustain." },
    sustain: { control: "boolean" },
    onNote: { action: "note" },
    onRelease: { action: "release" },
    className: { control: "text" },
    style: { control: "object" },
  },
  render: (a: Parameters<typeof PianoKeys>[0]) => <PianoKeys {...a} range={a.range || undefined} highlight={a.highlight || undefined} />,
} as never;
