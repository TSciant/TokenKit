import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eyebrow } from "./Eyebrow";
import { Icon } from "./Icon";

const meta = {
  title: "04 Primitives/17 Eyebrow",
  component: Eyebrow,
  argTypes: {
    children: { control: "text", description: "The label." },
    emphasis: {
      control: "inline-radio",
      options: [undefined, "quiet"],
      description: "quiet drops it back a step against busy surroundings.",
    },
  },
  args: { children: "About the kit", emphasis: undefined },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Small uppercase label above a headline. Use for: section kicker, hero eyebrow, scrim labels. Don't use for: primary actions (Button), filters (Chip), or long sentences.",
      },
    },
  },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
  render: ({ children, emphasis }) => (
    <div data-shell="stack" data-gap="4">
      <Eyebrow emphasis={emphasis}>
        <Icon name="sparkles" size="sm" />
        {children}
      </Eyebrow>
      <Eyebrow emphasis="quiet">Quiet emphasis</Eyebrow>
      <span data-tk="eyebrow-tag">Tag form</span>
    </div>
  ),
};

