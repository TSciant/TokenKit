import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceGroup } from "./ChoiceGroup";

const meta = {
  title: "04 Primitives/68 Choice group",
  component: ChoiceGroup,
  parameters: {
    docs: {
      description: {
        component:
          "A question answered by choosing from a few options: radio buttons for one, checkboxes for any number. Use for up to about seven options a reader should see at once. Don't use for a long list (a Select), a setting that applies at once (a Switch), or options that need room to explain themselves (ChoiceCard). A fieldset whose legend is the question, so each option is heard with it; native inputs, so the keyboard works as everywhere else (arrows between radios, Space to tick). An error is described on the group, marks each input invalid, and draws a rule down the group's edge, not only a colour.",
      },
    },
  },
  argTypes: {
    type: { control: "inline-radio", options: ["radio", "checkbox"] },
    legend: { control: "text" },
    name: { control: "text" },
    options: { control: "object" },
    hint: { control: "text" },
    error: { control: "text" },
    required: { control: "boolean" },
    value: { control: "object" },
    defaultValue: { control: "object" },
    onChange: { action: "changed" },
    layout: { control: "inline-radio", options: ["stack", "inline"] },
  },
  args: {
    type: "radio",
    legend: "How should we contact you?",
    name: "contact",
    hint: "We'll only use this to reply to your enquiry.",
    layout: "stack",
    options: [
      { value: "email", label: "Email", hint: "Usually within a working day" },
      { value: "phone", label: "Phone" },
      { value: "post", label: "Post", hint: "Up to two weeks" },
    ],
  },
} satisfies Meta<typeof ChoiceGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Checkboxes: Story = {
  args: {
    type: "checkbox",
    legend: "Which topics are you interested in?",
    name: "topics",
    hint: "Select all that apply.",
    defaultValue: ["policy"],
    options: [
      { value: "policy", label: "Transport policy" },
      { value: "workforce", label: "Workforce" },
      { value: "data", label: "Data and analytics" },
    ],
  },
};

export const YesNo: Story = {
  name: "Two short options, in a row",
  args: { legend: "Have you applied before?", name: "before", hint: undefined, layout: "inline", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
};

export const WithError: Story = {
  name: "With an error",
  args: { error: "Select how you'd like us to contact you", required: true },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Choice group laid over this one: the radio question, 400 wide." } },
    onion: { component: "ChoiceGroup", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 400 }}>
      <ChoiceGroup {...args} />
    </div>
  ),
};
