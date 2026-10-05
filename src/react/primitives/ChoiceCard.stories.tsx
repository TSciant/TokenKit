import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceCard } from "./ChoiceCard";


const meta = {
  title: "04 Primitives/32 Choice card",
  component: ChoiceCard,
  parameters: {
    docs: {
      description: {
        component:
          "Radios or checkboxes drawn as cards, for choosing between a few options that each need a sentence: plans, delivery speeds, a setup path. Built on the native input, so the group, arrow keys, Space, required, form submission and the screen-reader announcement are the browser's. The whole card is the label; the native dot or tick stays visible, so selection does not depend on the border's colour; selection thickens the border without moving anything. The control is named by the title and meta, and the description is its description. Use ChoiceCardGroup for a set (a fieldset with a legend, on the grid shell). Use for: two to six options with a description each. Don't use for: long lists (a select or plain radios), options with nothing to explain (plain radios), or actions (buttons).",
      },
    },
  },
  args: { type: "radio", name: "single", value: "team", title: "Team", meta: "$12 a month", description: "Five sites, every pack, a shared token library." },
  argTypes: {
    type: { control: "inline-radio", options: ["radio", "checkbox"] },
    title: { control: "text" },
    meta: { control: "text" },
    description: { control: "text" },
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
  },
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  decorators: [(Story) => <div style={{ inlineSize: 320 }}><Story /></div>],
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "One card, unchecked and checked, at 280px, for the Figma ChoiceCard to be laid over." } },
    onion: { component: "ChoiceCard", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div data-shell="stack" data-gap="3" style={{ inlineSize: 280 }}>
      <ChoiceCard name="onion" value="a" title="Starter" meta="Free" description="One site, the wireframe pack." />
      <ChoiceCard name="onion" value="b" title="Team" meta="$12 a month" description="Five sites, every pack." defaultChecked />
    </div>
  ),
};
