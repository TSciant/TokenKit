import type { Meta, StoryObj } from "@storybook/react-vite";
import { Guidance, GuidancePair } from "./Guidance";
import { PhaseBanner } from "./PhaseBanner";
import { SiteHeader } from "./SiteHeader";

const meta = {
  title: "04 Primitives/42 Phase banner",
  component: PhaseBanner,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A quiet strip above the site header saying what state the site is in (Prototype, Beta, Preview), optionally where you are, and one line of context. Sticky by default, so the caveat stays in view however far down a reader goes; a polite status region, so a change of page is announced. It goes above SiteHeader through the header's banner slot. Not an alert and not dismissible: the state it describes does not end when someone closes it. GOV.UK calls it a phase banner.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    title: { control: "text" },
    children: { control: "text" },
    sticky: { control: "boolean" },
    live: { control: "boolean" },
  },
  args: {
    label: "Prototype",
    title: "Home",
    children:
      "A clickable prototype for review. Content and links are placeholders.",
    sticky: false,
  },
} satisfies Meta<typeof PhaseBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithTheMainMenu: Story = {
  name: "With the main menu",
  parameters: {
    docs: {
      description: {
        story:
          "Through SiteHeader's banner slot. The banner is drawn before the header rather than inside it, so when it sticks it sticks to the page. Scroll the canvas: the banner stays, the header goes.",
      },
    },
  },
  render: (args) => (
    <div
      tabIndex={0}
      style={{ blockSize: "28rem", overflow: "auto" }}
    >
      <SiteHeader
        banner={<PhaseBanner {...args} sticky />}
        nav={[
          { label: "Services", href: "#main" },
          { label: "About", href: "#main" },
          { label: "Insights", href: "#main" },
          { label: "Contact", href: "#main" },
        ]}
      />
      <div
        data-shell="stack"
        data-gap="4"
        style={{ padding: "var(--tk-space-5)", blockSize: "60rem" }}
      >
        <p style={{ margin: 0 }}>The page scrolls under the banner.</p>
      </div>
    </div>
  ),
};

export const Phases: Story = {
  render: () => (
    <div data-shell="stack" data-gap="3">
      <PhaseBanner sticky={false} live={false} label="Prototype">
        Built for review. Nothing here is real yet.
      </PhaseBanner>
      <PhaseBanner sticky={false} live={false} label="Beta">
        This is a new service. Tell us what you think and we will use it to
        improve it.
      </PhaseBanner>
      <PhaseBanner
        sticky={false}
        live={false}
        label="Preview"
        title="Pricing page"
      >
        Changes since Tuesday are not published.
      </PhaseBanner>
    </div>
  ),
};

export const UsingPhaseBanners: Story = {
  name: "Using phase banners",
  parameters: { layout: "padded" },
  render: () => (
    <GuidancePair>
      <Guidance
        tone="do"
        note="Say what state the site is in, in a word, and what that means for the reader in one line: what is not real yet, or where feedback goes."
      >
        <PhaseBanner sticky={false} live={false} label="Beta">
          This is a new service. Tell us what you think.
        </PhaseBanner>
      </Guidance>
      <Guidance
        tone="dont"
        note="Don't use it for news or promotions. A strip that sometimes carries a sale teaches people to ignore it on the day it says the site is a prototype."
      >
        <PhaseBanner sticky={false} live={false} label="New">
          Spring sale: 20% off everything this week.
        </PhaseBanner>
      </Guidance>
    </GuidancePair>
  ),
};
