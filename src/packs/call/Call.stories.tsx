import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { CallBar, CallTile, CallTiles } from "./Call";
import type { CallState } from "./call-client.mjs";

/* No Figma component yet: these stories carry no `onion` parameter, so the toolbar's Figma and Onion buttons stay off
   here until a Packs · Call page exists. No camera is asked for: the moving pictures are drawn on a canvas. */
function useFakeStream(hue: number) {
  /* A still picture (a head and shoulders), drawn once: the motion gate keeps stories from asking for frames. */
  const [stream, setStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    const c = document.createElement("canvas"); c.width = 320; c.height = 180;
    const g = c.getContext("2d")!;
    const draw = () => { g.fillStyle = `hsl(${hue} 30% 30%)`; g.fillRect(0, 0, 320, 180); g.fillStyle = `hsl(${hue} 40% 60%)`; g.beginPath(); g.arc(160, 80, 38, 0, Math.PI * 2); g.fill(); g.fillRect(100, 128, 120, 60); };
    const s = c.captureStream?.() ?? null; setStream(s);
    draw(); const t = setTimeout(draw, 50);
    return () => { clearTimeout(t); s?.getTracks().forEach((x) => x.stop()); };
  }, [hue]);
  return stream;
}
const noop = { toggle: () => {}, leave: () => {} };

function InCall({ people = 3, mic = true, cam = true }: { people?: number; mic?: boolean; cam?: boolean }) {
  const a = useFakeStream(200), b = useFakeStream(30), c = useFakeStream(130);
  const others = [{ sessionId: "s2", username: "dad", stream: b }, { sessionId: "s3", username: "kite", stream: c }, { sessionId: "s4", username: "joining", stream: null }].slice(0, people - 1);
  const state: CallState = { status: "in", local: a, mic, cam, error: "", people: [{ sessionId: "s1", tracks: [], username: "you", me: true }, ...others.map((o) => ({ sessionId: o.sessionId, tracks: [], username: o.username, me: false }))], streams: Object.fromEntries(others.filter((o) => o.stream).map((o) => [o.sessionId, o.stream!])) };
  return <div style={{ display: "grid", gap: 16, maxWidth: 960 }}><CallTiles state={state} /><CallBar state={state} call={noop} /></div>;
}

const meta: Meta<typeof InCall> = {
  title: "10 Packs/04 Call",
  component: InCall,
  args: { people: 3, mic: true, cam: true },
  argTypes: { people: { control: { type: "range", min: 1, max: 4, step: 1 } }, mic: { control: "boolean" }, cam: { control: "boolean" } },
  parameters: { docs: { description: { component: "A small-group video call: tiles with names, and mute, camera and leave. The client talks to an SFU through a broker you run, so its secret stays on your server. See src/packs/call/README.md." } } },
};
export default meta;
type Story = StoryObj<typeof InCall>;

export const Playground: Story = {};
export const MutedCameraOff: Story = { name: "Muted, camera off", args: { mic: false, cam: false } };
export const Tiles: Story = {
  name: "Tile states",
  render: () => {
    const s = useFakeStream(260);
    return <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))", maxWidth: 960 }}><CallTile stream={s} name="@dad" /><CallTile stream={s} name="You" muted mirrored /><CallTile stream={s} name="@kite" off /><CallTile name="@joining" /></div>;
  },
};

/* One panel per component, each prop a control (the controls gate checks every prop has one somewhere). */
type TileArgs = { stream: "picture" | "none"; name: string; muted: boolean; mirrored: boolean; off: boolean; waiting: string; offText: string; style: Record<string, string> };
function TileDemo({ stream, ...a }: TileArgs) {
  const s = useFakeStream(260);
  return <div style={{ maxWidth: 420 }}><CallTile {...a} stream={stream === "picture" ? s : null} /></div>;
}
export const TilePlayground: StoryObj<TileArgs> = {
  name: "Tile: controls",
  args: { stream: "picture", name: "@dad", muted: false, mirrored: false, off: false, waiting: "Connecting…", offText: "Camera off", style: {} },
  argTypes: {
    stream: { control: "inline-radio", options: ["picture", "none"], description: "The person's MediaStream; none shows the waiting words." },
    name: { control: "text" }, muted: { control: "boolean", description: "Your own tile: no echo." }, mirrored: { control: "boolean", description: "Your own tile, as a mirror is." },
    off: { control: "boolean", description: "Camera off." }, waiting: { control: "text" }, offText: { control: "text" }, style: { control: "object" },
  },
  render: (a) => <TileDemo {...a} />,
} as never;

type TilesArgs = { you: string; state: { people: number; cam: boolean } };
function TilesDemo({ you, state: st }: TilesArgs) {
  const a = useFakeStream(200), b = useFakeStream(30), c = useFakeStream(130);
  const others = [{ sessionId: "s2", username: "dad", stream: b }, { sessionId: "s3", username: "kite", stream: c }].slice(0, Math.max(0, (st?.people ?? 3) - 1));
  const state: CallState = { status: "in", local: a, mic: true, cam: st?.cam ?? true, error: "", people: [{ sessionId: "s1", tracks: [], username: "you", me: true }, ...others.map((o) => ({ sessionId: o.sessionId, tracks: [], username: o.username, me: false }))], streams: Object.fromEntries(others.map((o) => [o.sessionId, o.stream!])) };
  return <div style={{ maxWidth: 960 }}><CallTiles state={state} you={you} /></div>;
}
export const TilesPlayground: StoryObj<TilesArgs> = {
  name: "Tiles: controls",
  args: { you: "You", state: { people: 3, cam: true } },
  argTypes: { you: { control: "text" }, state: { control: "object", description: "The call's state from useCall; here, how many people and your camera." } },
  render: (a) => <TilesDemo {...a} />,
} as never;

type BarArgs = { state: { mic: boolean; cam: boolean }; call: string; leaveText: string };
export const BarPlayground: StoryObj<BarArgs> = {
  name: "Bar: controls",
  args: { state: { mic: true, cam: true }, call: "useCall's call", leaveText: "Leave the call" },
  argTypes: { state: { control: "object", description: "mic and cam from the call's state." }, call: { control: false, description: "The call from useCall: toggle and leave." }, leaveText: { control: "text" } },
  render: (a) => <CallBar state={{ status: "in", people: [], streams: {}, local: null, error: "", ...a.state }} call={noop} leaveText={a.leaveText} />,
} as never;
