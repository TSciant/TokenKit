import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState, type ReactNode } from "react";
import { TvShell, TvRow, TvTile, TvSidebar, TvOsd } from "./Tv";
import type { TkTvOsdElement, TkTvShellElement, TvAccent, TvVerbDetail } from "./tk-tv.mjs";

/* No Figma component yet: these stories carry no `onion` parameter, so the toolbar's
   Figma and Onion buttons stay off here until a Packs · TV page exists. */
const THEMES = ["boosty", "dark", "light"] as const;
const dark = { background: "#07060a", padding: 24, borderRadius: 12 } as const;
const note = { color: "#d8d4e4", font: "13px/1.5 system-ui, sans-serif", margin: 0, maxWidth: "70ch" } as const;
const row = { display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" } as const;

/* Generic content only: no app names, no logos, no one's own tiles. */
type T = { label: string; sub: string; accent: TvAccent; badge?: string };
const FILMS: T[] = [
  { label: "Drama", sub: "Slow evenings", accent: "violet" }, { label: "Comedy", sub: "Something light", accent: "amber", badge: "New" },
  { label: "Documentary", sub: "True stories", accent: "emerald" }, { label: "Animation", sub: "For every age", accent: "cyan" },
  { label: "Classics", sub: "Black and white", accent: "pink" }, { label: "Shorts", sub: "Under twenty minutes", accent: "violet" },
  { label: "Family night", sub: "Everyone on the sofa", accent: "amber" }, { label: "Recently added", sub: "This week", accent: "emerald" },
];
const MUSIC: T[] = [
  { label: "Mixes", sub: "Made from what you play", accent: "emerald" }, { label: "Albums", sub: "Start to finish", accent: "violet" },
  { label: "Radio", sub: "Live now", accent: "pink", badge: "Live" }, { label: "Quiet", sub: "For reading", accent: "cyan" },
  { label: "Dance", sub: "Turn it up", accent: "amber" }, { label: "Sing along", sub: "Words on screen", accent: "emerald" },
];
const GAMES: T[] = [
  { label: "Puzzle", sub: "One more go", accent: "cyan" }, { label: "Racing", sub: "Two players", accent: "pink" },
  { label: "Party", sub: "Up to eight", accent: "amber" }, { label: "Cards", sub: "Take turns", accent: "emerald" },
  { label: "Words", sub: "Phone as the pad", accent: "violet" }, { label: "Arcade", sub: "Short and loud", accent: "cyan" },
];

/* Plain line icons for the sidebar, drawn here: no product marks. */
const ICON: Record<string, ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V20h-5v-6h-6v6H4z" />,
  films: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9.5v5l4.5-2.5z" /></>,
  music: <><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  games: <><rect x="2.5" y="7" width="19" height="10" rx="5" /><path d="M7 10v4M5 12h4M16 11h.01M18 13h.01" /></>,
  family: <><circle cx="8" cy="8" r="3" /><circle cx="16.5" cy="9.5" r="2.5" /><path d="M3 20c0-3 2.2-5 5-5s5 2 5 5M13 20c.3-2.4 1.8-4 3.5-4s3.2 1.6 3.5 4" /></>,
  ask: <><path d="M4 5h16v11H9l-5 4z" /><path d="M10 9.2a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9v.4M12 14h.01" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
};
const icon = (k: string) => <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "1.4em", height: "1.4em", flex: "none", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>{ICON[k]}</svg>;
const MENU = [["home", "Home"], ["films", "Films"], ["music", "Music"], ["games", "Games"], ["family", "Family"], ["ask", "Ask"], ["settings", "Settings"]] as const;
function Menu({ open = "home", onPick }: { open?: string; onPick?: (k: string) => void }) {
  return <>{MENU.map(([k, l]) => <button key={k} type="button" aria-current={k === open ? "page" : undefined} onClick={() => onPick?.(k)}>{icon(k)}<span>{l}</span></button>)}</>;
}
const tiles = (list: T[], n = list.length) => list.slice(0, n).map((t) => <TvTile key={t.label} {...t} />);

const meta: Meta<typeof TvShell> = {
  title: "10 Packs/03 TV",
  component: TvShell,
  args: { theme: "boosty", label: "TV home", input: "keys", capture: false, guides: false, screen: false, calm: false },
  argTypes: {
    theme: { control: "inline-radio", options: [...THEMES] },
    label: { control: "text" },
    input: { control: "inline-radio", options: ["keys", "pad", "keys pad", "none"] },
    capture: { control: "boolean", description: "Also read keys while focus is in a text field." },
    guides: { control: "boolean", description: "Action-safe, title-safe and safe-area guides (a development aid)." },
    screen: { control: "boolean", description: "A 16:9 frame with the rows scrolling inside it." },
    calm: { control: "boolean" },
    onVerb: { action: "tk-tv-verb" },
    onSelect: { action: "tk-tv-select" },
    onExit: { action: "tk-tv-exit" },
    children: { control: false },
    className: { control: false },
    style: { control: false },
  },
  parameters: { docs: { description: { component: "A 10-foot starter: a safe-area shell, titled rows of tiles, an on-screen display and a side menu, driven by five verbs (move, select, back, home, menu) from the arrow keys, a remote or a gamepad, with spatial focus between tiles. Three themes over --tk-tv-* tokens. Not in Figma yet. Tests: npm run test:tv." } } },
  decorators: [(S) => <div style={dark}><S /></div>],
};
export default meta;
type Story = StoryObj<typeof TvShell>;

/* The doc page: what the pack is, its API, and where its tests are. */
export const ReadMe: Story = {
  name: "Read me",
  parameters: { controls: { disable: true } },
  render: () => (
    <article style={{ color: "#ece8f6", font: "14px/1.55 system-ui, sans-serif", maxWidth: "68ch" }}>
      <h1 style={{ font: "800 24px/1.2 system-ui, sans-serif", margin: "0 0 8px" }}>TV pack</h1>
      <p>A starter for a 10-foot interface: something read from a sofa three metres away and driven by a remote, a D-pad, a gamepad or the arrow keys. It is the pieces every TV screen needs, not a whole TV system.</p>
      <ul>
        <li><code>&lt;tk-tv-shell&gt;</code>: the safe-area frame and the remote. <code>theme</code>, <code>label</code>, <code>input</code> (keys, pad), <code>capture</code>, <code>guides</code>, <code>screen</code>, <code>calm</code>. Events: <code>tk-tv-verb</code> (cancelable), <code>tk-tv-select</code>, <code>tk-tv-exit</code>.</li>
        <li><code>&lt;tk-tv-row&gt;</code>: a titled row of tiles that scrolls to keep focus in view, or a wrapping grid.</li>
        <li><code>&lt;tk-tv-tile&gt;</code>: a focusable tile: <code>label</code>, <code>sub</code>, <code>image</code>, <code>accent</code>, <code>badge</code>, <code>href</code>, <code>disabled</code>.</li>
        <li><code>&lt;tk-tv-osd&gt;</code>: an on-screen display line for volume, now playing or a message, which fades.</li>
        <li><code>&lt;tk-tv-sidebar&gt;</code>: the side menu, a rail that opens when focus comes in.</li>
        <li>React: <code>TvShell</code>, <code>TvRow</code>, <code>TvTile</code>, <code>TvOsd</code>, <code>TvSidebar</code> from <code>src/packs/tv</code>.</li>
      </ul>
      <p>The remote contract turns the arrow keys, Enter and Space, Backspace and Escape, the gamepad pack's D-pad, stick, A and B, and the keyboard pack's codes into five verbs: move, select, back, home and menu. Keys in a text field are ignored. Spatial focus moves by geometry, stays in a row, remembers each row's last tile, and Back returns to the level focus came from. Nothing traps focus.</p>
      <p>The focus ring is thick and two-toned, and the focused tile lifts, grows and underlines its title: never colour alone. Motion stops under reduced motion, <code>calm</code> and the kit's motion pause.</p>
      <p>From the Bobo TV prototype (Sep 2026) and the QCast stories. Figma: not drawn yet. Tests: <code>npm run test:tv</code>.</p>
    </article>
  ),
};

/* The home screen: a sidebar and three rows, driven by the arrow keys, a gamepad, or the
   on-screen remote below (the phone remote would send these same verbs). */
function HomeDemo(a: Parameters<typeof TvShell>[0]) {
  const shell = useRef<TkTvShellElement | null>(null), osd = useRef<TkTvOsdElement | null>(null);
  const [last, setLast] = useState("none yet"), [open, setOpen] = useState("home");
  const send = (verb: "move" | "select" | "back" | "home" | "menu", dir?: "up" | "down" | "left" | "right") => shell.current?.press(verb, dir);
  const btn = { font: "600 13px system-ui, sans-serif", minWidth: 44, minHeight: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #6f6880", background: "#14111b", color: "#f3efff", cursor: "pointer" } as const;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={note}>Click a tile (or Tab into the screen), then use the arrow keys: Enter or Space selects, Backspace or Escape goes back. A connected gamepad drives it too: the D-pad or left stick moves, A selects, B goes back, Menu opens the side menu.</p>
      <div ref={(el) => { shell.current = el?.querySelector("tk-tv-shell") as TkTvShellElement | null; }}>
        <TvShell {...a} onVerb={(d: TvVerbDetail) => { setLast(`${d.verb}${d.dir ? " " + d.dir : ""} (${d.source})`); a.onVerb?.(d); }} onSelect={(d) => { osd.current?.show({ kind: "now-playing", label: d.label, detail: "Starting", value: 0 }); a.onSelect?.(d); }}>
          <TvSidebar label="Main menu" collapse><Menu open={open} onPick={setOpen} /></TvSidebar>
          <TvRow label="Films">{tiles(FILMS)}</TvRow>
          <TvRow label="Music">{tiles(MUSIC)}</TvRow>
          <TvRow label="Games">{tiles(GAMES)}</TvRow>
          <tk-tv-osd ref={osd} slot="overlay" kind="now-playing" timeout="3000" />
        </TvShell>
      </div>
      <div role="group" aria-label="On-screen remote: sends the same verbs" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {([["up", "Up"], ["down", "Down"], ["left", "Left"], ["right", "Right"]] as const).map(([d, l]) => <button key={d} type="button" style={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => send("move", d)}>{l}</button>)}
        {([["select", "Select"], ["back", "Back"], ["home", "Home"], ["menu", "Menu"]] as const).map(([v, l]) => <button key={v} type="button" style={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => send(v)}>{l}</button>)}
      </div>
      <p style={note}>Last verb: {last}</p>
    </div>
  );
}
export const Home: Story = {
  name: "Home",
  args: { input: "keys pad", screen: true },
  parameters: { docs: { description: { story: "A shell with a collapsing side menu and Films, Music and Games rows. Up and down land on the nearest tile in the next row, or the one you left there; left from a row's first tile opens the menu; Back returns to where focus came from; Home goes to the first tile. Selecting a tile shows the now-playing line, which fades after three seconds." } } },
  render: (a) => <HomeDemo {...a} />,
};

/* The shell's own controls. */
export const Playground: Story = {
  render: (a) => (
    <TvShell {...a}>
      <TvSidebar label="Main menu"><Menu /></TvSidebar>
      <TvRow label="Films">{tiles(FILMS, 4)}</TvRow>
    </TvShell>
  ),
};

/* The ring drawn on the second tile with `focused`, so it is there to look at without
   taking focus; real focus (click a tile, then the arrow keys) draws the same thing. */
export const FocusRing: Story = {
  name: "Focus ring",
  parameters: { docs: { description: { story: "A two-tone ring (a gap in the background colour, then the ring colour: 3px and 6px in a 1920-wide frame), a 6px lift, a 6% grow and an underlined title: never colour alone. Under forced colours the ring is the system highlight outline. Under reduced motion, calm or the motion pause it changes at once instead of easing." } } },
  render: (a) => (
    <TvShell {...a}>
      <TvRow label="Focus">{FILMS.slice(0, 4).map((t, i) => <TvTile key={t.label} {...t} focused={i === 1} />)}</TvRow>
    </TvShell>
  ),
};

/* The safe area and the overscan guides. */
export const SafeArea: Story = {
  name: "Safe area and overscan",
  args: { guides: true, screen: true },
  parameters: { docs: { description: { story: "Content sits inside the title-safe area (5% in from each edge of a 16:9 frame; --tk-tv-safe-x and --tk-tv-safe-y). The dashed line is action-safe (93%), the dotted one title-safe (90%), the solid one the shell's padding. A panel that crops its edges takes --tk-tv-overscan on top." } } },
  render: (a) => (
    <div style={{ display: "grid", gap: 24 }}>
      <TvShell {...a}><TvSidebar label="Main menu"><Menu /></TvSidebar><TvRow label="Films">{tiles(FILMS, 5)}</TvRow></TvShell>
      <div style={{ ["--tk-tv-overscan" as string]: "24px" }}>
        <TvShell {...a} label="TV home, with 24px of overscan"><TvRow label="With 24px of overscan">{tiles(MUSIC, 4)}</TvRow></TvShell>
      </div>
    </div>
  ),
};

/* The on-screen display: shown and held here so it can be read; in use it fades. */
function OsdDemo() {
  const ref = useRef<TkTvOsdElement | null>(null);
  const [v, setV] = useState(40);
  const nudge = (d: number) => { const n = Math.max(0, Math.min(100, v + d)); setV(n); ref.current?.show({ kind: "volume", value: n, muted: false }); };
  const btn = { font: "600 13px system-ui, sans-serif", minHeight: 44, padding: "0 14px", borderRadius: 10, border: "1px solid #6f6880", background: "#14111b", color: "#f3efff", cursor: "pointer" } as const;
  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 760 }}>
      <TvOsd kind="volume" value={40} open persist />
      <TvOsd kind="volume" value={40} muted open persist />
      <TvOsd kind="now-playing" label="Drama" detail="24 of 98 minutes" value={24} open persist />
      <TvOsd kind="now-playing" label="Drama" paused open persist />
      <TvOsd kind="message" label="Gamepad connected" detail="Press A to select" open persist />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button type="button" style={btn} onClick={() => nudge(-10)}>Volume down</button>
        <button type="button" style={btn} onClick={() => nudge(10)}>Volume up</button>
        <span style={note}>Shows the line below for three seconds, then it fades (at once under reduced motion). Screen readers hear "Volume {v}".</span>
      </div>
      <tk-tv-osd ref={ref} kind="volume" value={String(v)} />
    </div>
  );
}
export const Osd: Story = {
  name: "OSD",
  parameters: { controls: { disable: true }, docs: { description: { story: "Volume shows a level and a number, or a slashed speaker and the word Muted; now playing shows the title, a line and progress, or the pause mark and the word Paused: never colour alone. The line itself is hidden from screen readers; a polite status says the same thing in words when it changes." } } },
  render: () => <OsdDemo />,
};

export const Themes: Story = {
  parameters: { controls: { disable: true } },
  render: (a) => (
    <div style={row}>
      {THEMES.map((t) => (
        <div key={t} style={{ flex: "1 1 280px", minWidth: 0 }}>
          <TvShell {...a} theme={t} label={`TV, ${t} theme`}><TvRow label={t}>{tiles(GAMES, 3)}</TvRow><TvOsd kind="volume" value={60} open persist /></TvShell>
        </div>
      ))}
    </div>
  ),
};

/* One panel per component: each gets its own controls (the controls gate checks every
   prop has a control somewhere). */
export const RowPlayground: StoryObj<typeof TvRow> = {
  name: "Row: controls",
  args: { label: "Films", layout: "row", level: 2 },
  argTypes: {
    label: { control: "text" },
    layout: { control: "inline-radio", options: ["row", "grid"] },
    level: { control: "select", options: [2, 3, 4, 5, 6] },
    theme: { control: "inline-radio", options: ["inherit", ...THEMES], mapping: { inherit: undefined }, description: "Unset: inherits the shell's theme." },
    children: { control: false },
  },
  render: (a: Parameters<typeof TvRow>[0]) => <TvShell label="TV"><TvRow {...a}>{tiles(FILMS)}</TvRow></TvShell>,
} as never;

export const TilePlayground: StoryObj<typeof TvTile> = {
  name: "Tile: controls",
  args: { label: "Films", sub: "Living-room catalog", accent: "emerald", badge: "", alt: "", image: "", href: "", disabled: false, current: "", focused: false },
  argTypes: {
    label: { control: "text" },
    sub: { control: "text" },
    image: { control: "text", description: "An image URL for the 16:9 art area." },
    alt: { control: "text" },
    accent: { control: "inline-radio", options: ["emerald", "violet", "amber", "cyan", "pink", "none"] },
    badge: { control: "text" },
    href: { control: "text" },
    disabled: { control: "boolean" },
    current: { control: "inline-radio", options: ["", "true", "page"] },
    focused: { control: "boolean", description: "Draw the focus ring without focus." },
    theme: { control: "inline-radio", options: ["inherit", ...THEMES], mapping: { inherit: undefined }, description: "Unset: inherits the shell's theme." },
    onSelect: { action: "tk-tv-select" },
  },
  render: (a: Parameters<typeof TvTile>[0]) => <TvShell label="TV"><TvRow label="One tile"><TvTile {...a} /><TvTile label="Music" sub="Next to it" accent="violet" /></TvRow></TvShell>,
} as never;

export const SidebarPlayground: StoryObj<typeof TvSidebar> = {
  name: "Sidebar: controls",
  args: { label: "Main menu", collapse: false },
  argTypes: {
    label: { control: "text" },
    collapse: { control: "boolean", description: "A slim rail until focus comes in." },
    theme: { control: "inline-radio", options: ["inherit", ...THEMES], mapping: { inherit: undefined }, description: "Unset: inherits the shell's theme." },
    children: { control: false },
  },
  render: (a: Parameters<typeof TvSidebar>[0]) => <TvShell label="TV"><TvSidebar {...a}><Menu /></TvSidebar><TvRow label="Films">{tiles(FILMS, 3)}</TvRow></TvShell>,
} as never;

export const OsdPlayground: StoryObj<typeof TvOsd> = {
  name: "OSD: controls",
  args: { kind: "volume", value: 40, muted: false, label: "Drama", detail: "24 of 98 minutes", paused: false, open: true, persist: true, timeout: 3000, calm: false },
  argTypes: {
    kind: { control: "inline-radio", options: ["volume", "now-playing", "message"] },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    muted: { control: "boolean" },
    label: { control: "text" },
    detail: { control: "text" },
    paused: { control: "boolean" },
    open: { control: "boolean" },
    persist: { control: "boolean" },
    timeout: { control: { type: "number", min: 1000, step: 500 } },
    theme: { control: "inline-radio", options: ["inherit", ...THEMES], mapping: { inherit: undefined }, description: "Unset: inherits the shell's theme." },
    calm: { control: "boolean" },
  },
  render: (a: Parameters<typeof TvOsd>[0]) => <div style={{ paddingBlock: 12 }}><TvOsd {...a} /></div>,
} as never;
