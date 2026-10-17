import type { Meta, StoryObj } from "@storybook/react-vite";
import { SummaryList } from "./SummaryList";

const meta = {
  title: "04 Primitives/72 Summary list",
  component: SummaryList,
  parameters: {
    docs: {
      description: {
        component:
          "Facts as pairs of a name and a value, each changeable. Use for what a reader has entered before they send it (check your answers), or the details of a record. Don't use for data compared across rows and columns (a Table). A description list, read as pairs; each row's action says what it changes (\"Change\", then, hidden, the row's name), because a page of links all called \"Change\" is no help to someone moving between links. Three columns when there is room; in a box under 32rem the value goes under its name.",
      },
    },
  },
  argTypes: {
    rows: { control: "object" },
    divided: { control: "boolean" },
  },
  args: {
    divided: true,
    rows: [
      { key: "Name", value: "Sarah Philips", action: { label: "Change", href: "#name" } },
      { key: "Date of birth", value: "5 January 1978", action: { label: "Change", href: "#dob" } },
      { key: "Address", value: <p>72 Guild Street<br />London<br />SE23 6FH</p>, action: { label: "Change", href: "#address", context: "address" } },
      { key: "Contact details", value: <p>07700 900457<br />sarah.phillips@example.com</p>, action: { label: "Change", href: "#contact", context: "contact details" } },
    ],
  },
} satisfies Meta<typeof SummaryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: "44rem" }}>
      <SummaryList {...args} />
    </div>
  ),
};

export const Narrow: Story = {
  name: "A narrow box",
  render: (args) => (
    <div style={{ maxInlineSize: "20rem" }}>
      <SummaryList {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Summary list laid over this one: four rows, 640 wide." } },
    onion: { component: "SummaryList", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 640 }}>
      <SummaryList {...args} />
    </div>
  ),
};
