import type { Meta, StoryObj } from "@storybook/react-vite";
import { Media } from "./Media";

const meta = {
  title: "04 Primitives/06 Media",
  component: Media,
  parameters: {
    docs: {
      description: {
        component:
          "The canonical two-part assembly: a figure at a fixed basis beside a fluid body. Collapses to a column at 24rem of its own width, not the viewport's. Use for: Image or video frames that participate in motion FX and ratio tokens. Don't use for: Captioned figures that need credit/caption structure (use Figure), or full-bleed heroes (use Plate + scrim).",
      },
    },
  },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  args: {
    figure: <div style={{ inlineSize: "100%", blockSize: "100%" }} />,
    children: (
      <>
        <strong>Media object</strong>
        <p data-tk="card-body">Figure beside body, collapsing on its own box.</p>
      </>
    ),
  },
} satisfies Meta<typeof Media>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Collapse: Story = {
  name: "Collapses on its own width",
  render: (args) => (
    <div data-shell="stack" data-gap="5">
      {[36, 24, 18].map((rem) => (
        <div key={rem}>
          <p className="tk-doc-sub">{rem}rem</p>
          <div style={{ inlineSize: `${rem}rem`, maxInlineSize: "100%" }}>
            <Media {...args} />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { size: "md" },
  argTypes: { container: { control: "inline-radio", options: ["wide", "narrow"] } } as never,
  parameters: {
    docs: { description: { story: "The Figma component laid over this one. Container is the width it sits in: wide is 480px, narrow is 320px. When the box cannot give the body 16rem beside the figure, the body wraps below it at full width: the same component answers to where it is put, with no query and no wrapper. Switch Onion in the toolbar." } },
    onion: {
      component: "Media",
      skin: (a: Record<string, unknown>) => `${(a.size as string) ?? "md"}-${(a as { container?: string }).container ?? "wide"}.png`,
    },
  },
  render: ({ container = "wide", ...args }: Record<string, unknown> & { container?: string }) => (
    <div style={{ inlineSize: container === "narrow" ? 320 : 480 }}>
      <Media {...(args as object)} figure={<span />}>
        <h3 style={{ margin: 0, fontSize: "var(--tk-size-lg)", fontWeight: "var(--tk-weight-semibold)", lineHeight: "var(--tk-leading-snug)" }}>Media title</h3>
        <p style={{ margin: 0, color: "var(--tk-text-secondary)" }}>Supporting copy beside or under the figure, depending on the container.</p>
      </Media>
    </div>
  ),
};
