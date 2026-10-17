import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./Switch";

const meta = {
  title: "04 Primitives/69 Switch",
  component: Switch,
  parameters: {
    docs: {
      description: {
        component:
          "A setting that is on or off and takes effect at once. Use for a preference that changes something straight away, with no save button. Don't use for a choice sent with a form (a checkbox), or more than two states. A native checkbox with the switch role: reached by Tab, flipped by Space, read as on or off; the whole row is the label. The track's edge clears 3:1 on every surface and the thumb moves, so the state is never only a colour. `stateLabels` adds visible words for the state.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    stateLabels: { control: "object" },
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: { label: "Email me when someone replies", hint: "At most one email a day.", defaultChecked: true },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: "28rem" }}>
      <Switch {...args} />
    </div>
  ),
};

export const WithState: Story = {
  name: "With its state in words",
  args: { stateLabels: ["On", "Off"], hint: undefined, label: "Dark theme", defaultChecked: false },
  render: (args) => (
    <div style={{ maxInlineSize: "28rem" }}>
      <Switch {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Switch laid over this one: on, with a hint, 400 wide." } },
    onion: { component: "Switch", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 400 }}>
      <Switch {...args} />
    </div>
  ),
};
