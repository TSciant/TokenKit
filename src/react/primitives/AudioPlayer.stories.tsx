import type { Meta, StoryObj } from "@storybook/react-vite";
import { AudioPlayer } from "./AudioPlayer";

/* A minute of quiet two-note tone, made here as a WAV, so the stories play
   something without an audio file in the repository (media stays out of
   git). 8 kHz, 8-bit, mono: 480 KB in memory, a soft fifth that swells. */
function tone(secs = 60): string {
  if (typeof window === "undefined" || typeof Blob === "undefined") return "";
  const rate = 8000, n = rate * secs, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); v.setUint32(4, 36 + n, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, "data"); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) {
    const t = i / rate, fade = Math.min(1, t / 2, (secs - t) / 2), swell = 0.6 + 0.4 * Math.sin(t * 0.8);
    const s = (Math.sin(2 * Math.PI * 220 * t) + 0.6 * Math.sin(2 * Math.PI * 330 * t)) / 1.6;
    v.setUint8(44 + i, 128 + Math.round(s * 22 * fade * swell));
  }
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}
const TONE = tone();

const TRANSCRIPT = (
  <>
    <p>
      <strong>Host:</strong> Welcome back. Today we are talking about why a design system's values should live in one
      place, and every tool should read them from there.
    </p>
    <p>
      <strong>Guest:</strong> The short version is that a value copied is a value that drifts. The moment a colour lives
      in two files, one of them is wrong.
    </p>
    <p>
      <strong>Host:</strong> So the loop is: change the token, and every surface that reads it changes with it.
    </p>
  </>
);

const meta = {
  title: "04 Primitives/75 Audio player",
  component: AudioPlayer,
  parameters: {
    docs: {
      description: {
        component:
          "A clip or an episode, played on the page. Use for audio someone chooses to hear: a podcast episode, an interview, a recorded talk. Don't use for sound that plays by itself (never autoplay), music under a page, or video (VideoPlayer). A native audio element with the kit's own controls, so every control is a real button or slider: play and pause (named with the title), back and forward fifteen seconds, the position (a range whose arrow keys move fifteen seconds and which is read as \"1:05 of 24:05\"), the speed (a button that steps through 1×, 1.25×, 1.5×, 2× and 0.75×) and mute (a toggle). Volume is left to the device. The title is required and names the player; a description above it is optional. In a box under 36rem the tools take a row of their own. A transcript, when there is one, opens under the controls. The stories play a generated tone, not a file.",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    src: { control: false },
    duration: { control: "text" },
    transcript: { control: false },
    transcriptHref: { control: "text" },
    speeds: { control: "object" },
    skip: { control: "number" },
    words: { control: "object" },
  },
  args: {
    title: "Values freed from tools",
    description: "Episode 12 · The token-kit podcast",
    src: TONE,
    duration: "1:00",
    skip: 15,
  },
} satisfies Meta<typeof AudioPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithTranscript: Story = {
  name: "With a transcript",
  parameters: {
    docs: { description: { story: "The transcript opens under the controls, and scrolls inside its own box when it is long. A download link sits at its end." } },
  },
  args: { transcript: TRANSCRIPT, transcriptHref: "#transcript.txt" },
};

export const Narrow: Story = {
  name: "In a narrow box",
  parameters: {
    docs: { description: { story: "Under 36rem the tools drop under the title and spread across, so the position keeps its length." } },
  },
  render: (args) => (
    <div style={{ maxInlineSize: 320 }}>
      <AudioPlayer {...args} />
    </div>
  ),
};

export const TitleOnly: Story = {
  name: "Title only",
  args: { description: undefined },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Audio player laid over this one: stopped at the start, 640 wide." } },
    onion: { component: "AudioPlayer", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 640 }}>
      <AudioPlayer {...args} />
    </div>
  ),
};
