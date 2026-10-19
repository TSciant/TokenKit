import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "./Accordion";
import { Heading } from "./Heading";

const meta = {
  title: "04 Primitives/61 Accordion",
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          "Sections of one page that a reader opens one at a time, each behind its heading. Use for a page of several sections where most readers want one or two (past years of an event, the parts of a long policy). Don't use for questions and answers (FAQ numbers them), content everyone needs (hiding it makes it harder to find), or switching between views of one thing (tabs). Each heading holds a button that says whether its section is open; the headings stay headings, so a screen-reader user can list them and jump. Several can be open at once.",
      },
    },
  },
  argTypes: {
    items: { control: "object" },
    level: { control: "inline-radio", options: [2, 3, 4] },
  },
  args: {
    level: 3,
    items: [
      { heading: "2025", content: <p style={{ margin: 0 }}>Four sessions, each with its recording and slides.</p> },
      { heading: "2024", content: <p style={{ margin: 0 }}>Three sessions; the recordings were not kept.</p> },
      { heading: "2023", content: <p style={{ margin: 0 }}>The first year: two sessions and a report.</p> },
    ],
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const UnderAHeading: Story = {
  name: "Under a heading, one open",
  parameters: {
    docs: {
      description: {
        story: "In place: a section heading over the accordion, its sections a level below, the newest open on first paint.",
      },
    },
  },
  args: {
    items: [
      { heading: "2025", defaultOpen: true, content: <p style={{ margin: 0 }}>Four sessions, each with its recording and slides.</p> },
      { heading: "2024", content: <p style={{ margin: 0 }}>Three sessions; the recordings were not kept.</p> },
    ],
  },
  render: (args) => (
    <div data-shell="stack" data-gap="3" style={{ maxInlineSize: "44rem" }}>
      <Heading level={2} text="heading-m">
        Previous sessions
      </Heading>
      <Accordion {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Accordion laid over this one: three closed sections, 480 wide." } },
    onion: { component: "Accordion", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 480 }}>
      <Accordion {...args} />
    </div>
  ),
};
