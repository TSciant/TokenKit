import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plate } from "./Plate";
import { VideoPlayer } from "./VideoPlayer";

const meta = {
  title: "04 Primitives/50 Video player",
  component: VideoPlayer,
  parameters: {
    docs: {
      description: {
        component:
          "A video shown as its poster until the viewer presses play. Nothing from a third party loads before that press: no player script, no iframe, no cookie. Pressing play swaps the poster for the player in the same box at the same ratio (a native video for a self-hosted file; youtube-nocookie.com, or Vimeo with do-not-track, for an embed) and moves focus into it. The play button is a real button named \"Play: \" and the title, and the whole poster presses it; the running time and a CC marker are read as its description. No story here loads anything from YouTube or Vimeo until its button is pressed.",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
    poster: { control: false, description: "Any picture. Default: a Plate labelled with posterLabel." },
    posterLabel: { control: "text" },
    ratio: { control: "select", options: ["16 / 9", "4 / 3", "1 / 1", "9 / 16", "21 / 9"] },
    duration: { control: "text" },
    src: { control: "text" },
    embed: { control: "object" },
    captions: { control: "boolean" },
    transcriptHref: { control: "text" },
  },
  args: {
    title: "A two-minute tour of the new dashboard",
    posterLabel: "Product tour",
    ratio: "16 / 9",
    duration: "2:14",
    captions: true,
    transcriptHref: "#main",
    /* A placeholder id: pressing play loads the service's own "unavailable"
       page, and nothing at all is requested before the press. */
    embed: { provider: "youtube", id: "VIDEO_ID" },
  },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: "48rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SelfHosted: Story = {
  name: "Self-hosted file",
  parameters: {
    docs: {
      description: {
        story:
          "A file the site serves itself: after play, a native video with the browser's own controls, so nothing outside the site is ever asked for. The poster here is a Plate passed in. (The sample file is not served in Storybook, so the player stays empty once pressed.)",
      },
    },
  },
  args: {
    title: "Welcome from the support team",
    embed: undefined,
    src: "/media/welcome.mp4",
    poster: <Plate seed={3} ratio="16 / 9" placement={false} />,
    duration: "52:14",
    captions: false,
    transcriptHref: undefined,
  },
};

export const Ratios: Story = {
  name: "Ratios",
  parameters: {
    docs: {
      description: {
        story:
          "The poster and the player share one ratio, so nothing on the page moves on play: widescreen, square and an upright phone clip, side by side.",
      },
    },
  },
  render: () => (
    <div data-shell="grid" data-gap="4" data-cols="3" data-align="start">
      <VideoPlayer title="Setting up an account" posterLabel="16 : 9" ratio="16 / 9" duration="3:40" embed={{ provider: "vimeo", id: "VIDEO_ID" }} />
      <VideoPlayer title="Three tips for the weekly report" posterLabel="1 : 1" ratio="1 / 1" duration="0:45" captions embed={{ provider: "youtube", id: "VIDEO_ID" }} />
      <VideoPlayer title="A minute on the shop floor" posterLabel="9 : 16" ratio="9 / 16" duration="1:02" src="/media/shop-floor.mp4" />
    </div>
  ),
};

export const NotReady: Story = {
  name: "No video yet",
  parameters: {
    docs: {
      description: {
        story:
          "A wireframe slot where a video will go. With no src and no embed there is nothing to play, so the button is marked unavailable and says why, rather than doing nothing when pressed.",
      },
    },
  },
  args: {
    title: "Customer stories",
    posterLabel: "Video",
    embed: undefined,
    duration: undefined,
    captions: false,
    transcriptHref: undefined,
  },
};
