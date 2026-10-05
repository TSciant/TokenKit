import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceCardGroup, type ChoiceCardOption } from "./ChoiceCard";

const PLANS: ChoiceCardOption[] = [
  { value: "starter", title: "Starter", meta: "Free", description: "One site, the wireframe pack, community help." },
  { value: "team", title: "Team", meta: "$12 a month", description: "Five sites, every pack, a shared token library." },
  { value: "studio", title: "Studio", meta: "$40 a month", description: "Unlimited sites, your own packs, priority help." },
];

/* The group's own panel, in the same sidebar entry as the card. */
const meta = {
  title: "04 Primitives/32 Choice card",
  component: ChoiceCardGroup,
  args: { legend: "Choose a plan", name: "plan", options: PLANS, defaultValue: "team", type: "radio", columns: 3 },
  argTypes: {
    type: { control: "inline-radio", options: ["radio", "checkbox"] },
    columns: { control: "inline-radio", options: [1, 2, 3, 4] },
    hideLegend: { control: "boolean" },
    required: { control: "boolean" },
    hint: { control: "text" },
    legend: { control: "text" },
    name: { control: "text" },
    options: { control: "object" },
    defaultValue: { control: "text" },
    value: { control: false },
    onChange: { control: false },
  },
  decorators: [(Story) => <div style={{ inlineSize: "56rem", maxInlineSize: "100%" }}><Story /></div>],
} satisfies Meta<typeof ChoiceCardGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GroupPlayground: Story = { name: "Group playground" };

export const Group: Story = {
  name: "A group (radios)",
  render: () => <ChoiceCardGroup legend="Choose a plan" name="plan" options={PLANS} defaultValue="team" />,
};

export const Checkboxes: Story = {
  name: "A group (checkboxes, any number)",
  render: () => (
    <ChoiceCardGroup
      type="checkbox"
      legend="Add to your order"
      name="extras"
      defaultValue={["install"]}
      options={[
        { value: "install", title: "Installation", meta: "$40", description: "Fitted on the day of delivery." },
        { value: "removal", title: "Take the old one away", meta: "$15", description: "Recycled where it can be." },
        { value: "warranty", title: "Three-year cover", meta: "$60", description: "Parts and labour." },
      ]}
    />
  ),
};

export const WithDisabled: Story = {
  name: "A group with an unavailable option",
  render: () => (
    <ChoiceCardGroup
      legend="Delivery"
      name="delivery"
      defaultValue="standard"
      hint="Next-day delivery is not available to this postcode."
      columns={2}
      options={[
        { value: "standard", title: "Standard", meta: "Free", description: "Three to five working days." },
        { value: "next", title: "Next day", meta: "$9", description: "Order by 8pm.", disabled: true },
      ]}
    />
  ),
};

