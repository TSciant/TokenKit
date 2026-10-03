import type { Meta, StoryObj } from "@storybook/react-vite";
import { Arrow } from "./Arrow";

const meta = {
  title: "04 Primitives/29 Arrow",
  component: Arrow,
  parameters: {
    docs: {
      description: {
        component:
          "The 16px arrow that trails a primary call to action and leads a list item. Use for: the end of a link or button that goes somewhere, and the lead of a list of destinations. Don't use for: a control that expands or collapses (that is a chevron), or on its own: it is hidden from assistive technology on purpose, because the link text already says where it goes. One path, in the current ink, so it takes the colour of whatever it sits in.",
      },
    },
  },
} satisfies Meta<typeof Arrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InAContext: Story = {
  name: "In a link and in ink",
  render: () => (
    <div data-shell="stack" data-gap="3">
      <a href="#main" style={{ display: "inline-flex", gap: "var(--tk-space-2)", alignItems: "center" }}>
        Read more <Arrow />
      </a>
      <div data-on="inverse" style={{ display: "inline-flex", gap: "var(--tk-space-2)", alignItems: "center", padding: "var(--tk-space-3)" }}>
        Read more <Arrow />
      </div>
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma component laid over this one at the 16px it is drawn at. Switch Onion in the toolbar." } },
    onion: { component: "Arrow", target: "root", skin: () => "default.png" },
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 16, blockSize: 16 }}>
        <Story />
      </div>
    ),
  ],
};
