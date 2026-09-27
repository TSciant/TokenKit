import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "./Search";

const meta = {
  title: "04 Primitives/19 Search",
  component: Search,
  argTypes: {
    placeholder: { control: "text" },
    label: {
      control: "text",
      description: "Accessible name for the field and the toggle.",
    },
    open: {
      control: "boolean",
      description:
        "Controlled open state. Leave it off and the component keeps its own.",
    },
  },
  args: { placeholder: "Search", label: "Search" },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Header search that keeps one DOM: input collapses instead of swapping subtrees. Use for: site chrome search. Don't use for: search hit lists (Search results), or a full-page find UI.",
      },
    },
  },
} satisfies Meta<typeof Search>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsible: Story = {
  name: "Collapsible",
  render: (args) => (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        padding: "var(--tk-space-4)",
      }}
    >
      <Search {...args} />
    </div>
  ),
};

