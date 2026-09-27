import type { Meta, StoryObj } from "@storybook/react-vite";
import { Disclosure } from "./Disclosure";

const meta = {
  title: "04 Primitives/18 Disclosure",
  component: Disclosure,
  argTypes: {
    children: { control: "text", description: "Panel contents." },
  },
  args: {
    children:
      "Panel that arrives with @starting-style — opacity and a short rise on insert.",
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Opt-in entrance panel (data-tk=panel) animated on DOM insert. Use for: reveal stacks and inserted panels that should arrive, not snap. Don't use for: everything on first paint, or FAQ rows (use FAQ).",
      },
    },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enter: Story = {
  name: "Entrance",
  render: ({ children }) => (
    <Disclosure
      style={{
        padding: "var(--tk-space-4)",
        border: "1px solid var(--tk-line-default)",
        borderRadius: "var(--tk-radius-nested)",
      }}
    >
      <p data-tk="card-body" style={{ margin: 0 }}>
        {children}
      </p>
    </Disclosure>
  ),
};

