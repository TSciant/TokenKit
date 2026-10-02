import type { Meta, StoryObj } from "@storybook/react-vite";
import { LogoLadder, type LogoStage } from "./LogoLadder";

const meta = {
  title: "04 Primitives/22 Logo ladder",
  component: LogoLadder,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A logo that picks its own stage from the width of the box it is handed — full lockup in a hero, bare mark in a 48px sidebar, keylined icon at favicon size. The decision is a container query, so the page never has to know which one it is asking for. Use for: any placement where the logo's slot is not a fixed width — headers that collapse, cards, sidebars, footers, app icons. Don't use for: a fixed export at a known size, where a single SVG is simpler and honest.",
      },
    },
  },
  argTypes: {
    word: { control: "text" },
    tagline: { control: "text" },
    smStage: {
      control: "inline-radio",
      options: ["mark", "word"],
      description: "Which of the two stages sharing the >= 80px band this brand uses.",
    },
    stage: {
      control: "select",
      options: [undefined, "icon", "mark", "word", "stack", "lockup", "full"],
      description: "Pin a stage and ignore the container. For specimen sheets only.",
    },
    href: { control: "text" },
    label: { control: "text" },
    mark: { control: false, description: "Slot — the symbol, ideally an inline svg." },
    className: { control: "text" },
    style: { control: "object" },
  },
  args: {
    word: "tokenkit",
    tagline: "bending the rules",
    smStage: "mark",
  },
} satisfies Meta<typeof LogoLadder>;

export default meta;
type Story = StoryObj<typeof meta>;

/* The band each stage answers to. `>=` rather than a range, deliberately:
   min-width is inclusive, so ranges drawn as 80–160 / 160–280 overlap at
   every boundary and let source order decide. */
const LADDER: [LogoStage, string, string][] = [
  ["full", ">= 420px", "mark + wordmark + tagline — heroes, launch screens"],
  ["lockup", ">= 280px", "mark beside wordmark — the default site header"],
  ["stack", ">= 160px", "mark above wordmark — narrow columns, square slots"],
  ["word", ">= 80px", "wordmark alone — set smStage=\"word\" for type-led brands"],
  ["mark", ">= 80px", "mark alone — set smStage=\"mark\" when the symbol carries"],
  ["icon", "< 80px", "mark in its own keyline — favicons, notifications"],
];

/**
 * The specimen sheet. Every stage pinned, so all six sit in boxes of the same
 * width — the one case where asking the container is the wrong thing to do.
 */
export const Ladder: Story = {
  name: "The ladder",
  render: (args) => (
    <div data-shell="stack" data-gap="4" style={{ padding: "var(--tk-space-5)" }}>
      <p className="tk-doc-note" style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
        Six stages, one component, one DOM tree. Nothing remounts when a
        container crosses a band, so a logo mid-animation in a resizing sidebar
        keeps animating rather than starting over.
      </p>
      <div data-shell="grid" data-cols="3" data-gap="3">
        {LADDER.map(([stage, band, why]) => (
          <div
            key={stage}
            data-shell="stack"
            data-gap="2"
            style={{
              padding: "var(--tk-space-4)",
              border: "1px solid var(--tk-line-default)",
              borderRadius: "var(--tk-radius-md)",
              background: "var(--tk-surface-default)",
            }}
          >
            <div data-shell="inline" data-gap="2" style={{ justifyContent: "space-between" }}>
              <strong style={{ fontSize: "var(--tk-size-sm)", textTransform: "uppercase" }}>
                {stage}
              </strong>
              <code style={{ fontSize: "var(--tk-size-xs)" }}>{band}</code>
            </div>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                minBlockSize: "6rem",
                padding: "var(--tk-space-4)",
                background: "var(--tk-surface-sunken)",
                borderRadius: "var(--tk-radius-sm)",
              }}
            >
              <LogoLadder {...args} stage={stage} />
            </div>
            <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-xs)" }}>
              {why}
            </p>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * The same logo, unpinned, in a box you can drag. This is the story that
 * actually makes the argument — the stage changes and no prop changed.
 */
export const Responsive: Story = {
  name: "Live",
  argTypes: {
    // @ts-expect-error — story-only knob, not a component prop.
    containerWidth: { control: { type: "range", min: 48, max: 640, step: 4 } },
  },
  // @ts-expect-error — story-only knob, not a component prop.
  args: { containerWidth: 360, stage: undefined },
  render: (args) => {
    const width = (args as unknown as { containerWidth: number }).containerWidth;
    return (
      <div data-shell="stack" data-gap="4" style={{ padding: "var(--tk-space-5)" }}>
        <p className="tk-doc-note" style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
          Drag <code>containerWidth</code>. Nothing about the logo changes — the
          box changes, and the logo reads the box. Crossing 420, 280, 160 and 80
          moves it down the ladder.
        </p>
        <div
          style={{
            inlineSize: `${width}px`,
            maxInlineSize: "100%",
            padding: "var(--tk-space-4)",
            border: "1px dashed var(--tk-line-strong)",
            borderRadius: "var(--tk-radius-md)",
            background: "var(--tk-surface-default)",
            transition: "inline-size var(--tk-motion-standard)",
          }}
        >
          <LogoLadder {...args} stage={undefined} />
        </div>
        <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-xs)" }}>
          Box is {width}px.
        </p>
      </div>
    );
  },
};

/**
 * The same ladder for a brand whose name carries and whose mark does not.
 * The only difference is one prop.
 */
export const TypeLed: Story = {
  name: "Type-led brand",
  /* Deliberately a made-up name rather than one of the specimen brands. This
     story is about the mechanism; the specimen sheet is where recognisable
     brands earn their place, because there the point is that you can tell
     what survived the reduction. */
  args: { smStage: "word", word: "longitude", tagline: "every step, measured" },
  render: (args) => (
    <div data-shell="stack" data-gap="4" style={{ padding: "var(--tk-space-5)" }}>
      <p className="tk-doc-note" style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
        <code>smStage=&quot;word&quot;</code>. At the shared 80px band this brand
        shows its name instead of its symbol — a fact about the brand, not about
        the box, which is why it is a prop and not a seventh query.
      </p>
      <div data-shell="grid" data-cols="3" data-gap="3">
        {LADDER.map(([stage]) => (
          <div
            key={stage}
            style={{
              display: "grid",
              placeItems: "center",
              minBlockSize: "5rem",
              padding: "var(--tk-space-4)",
              background: "var(--tk-surface-sunken)",
              borderRadius: "var(--tk-radius-sm)",
            }}
          >
            <LogoLadder {...args} stage={stage} />
          </div>
        ))}
      </div>
    </div>
  ),
};

/* One box per stage, in the band the stage answers to, so the pinned stage and the
   unpinned logo draw the same thing. The skin is the box, not just the logo. */
const BOX: Record<LogoStage, number> = { icon: 64, mark: 120, word: 120, stack: 200, lockup: 320, full: 480 };

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { stage: "full", word: "tokenkit", tagline: "bending the rules" },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, a stage at a time, each in a box of the width its band starts at: 64, 120, 200, 320 and 480px. Switch Onion in the toolbar." } },
    onion: { component: "LogoLadder", target: "root", skin: (a: Record<string, unknown>) => `${a.stage}.png` },
  },
  decorators: [
    (Story, context) => (
      <div style={{ inlineSize: BOX[(context.args.stage ?? "full") as LogoStage] }}>
        <Story />
      </div>
    ),
  ],
};
