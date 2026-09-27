import type { Meta, StoryObj } from "@storybook/react-vite";
import { TokenPlayground } from "./TokenPlayground";

/**
 * 07 Playground — where you drive the system instead of reading about it.
 *
 * The rest of the sidebar documents the contract. This section hands you the
 * knobs: tokens editable on the canvas, continuously rather than from a list
 * of three, with the resolved values printed beside them.
 */
const meta = {
  title: "07 Playground/01 Tokens",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Five contract slots on sliders, a live specimen built from real components, and a getComputedStyle readout of what the cascade produced. Root font size writes to the document element and is restored on unmount, because rem is relative to the root by definition and a scoped version of that control would move nothing.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
  name: "Drive the tokens",
  render: () => <TokenPlayground />,
};
