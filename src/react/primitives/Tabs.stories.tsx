import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "./Tabs";

const agenda = (
  <ol data-shell="stack" data-gap="2" style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
    <li>9:00 Welcome and the year in numbers</li>
    <li>9:30 What changed when the schedule followed demand</li>
    <li>10:45 Panel: three services, one waiting list</li>
    <li>12:00 Close</li>
  </ol>
);

const meta = {
  title: "04 Primitives/58 Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          "Views of one thing, one at a time, chosen from a row of labels. Use for parts of one subject that a reader looks at one by one (an event's agenda, speakers and recordings). Don't use for going to another page (section nav, which is links), the steps of a form, or content a reader needs to compare side by side. The ARIA tabs pattern with automatic activation: the arrow keys move along the row and select as they go, Home and End go to the ends, Tab moves into the panel. The row looks like section nav on purpose; these are buttons and change the view, not the page. When the labels do not fit, the row scrolls sideways.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    items: { control: "object" },
    defaultSelected: { control: "inline-radio", options: ["agenda", "speakers", "recordings"] },
    selected: { control: false },
    onSelect: { control: false },
  },
  args: {
    label: "Event details",
    defaultSelected: "agenda",
    items: [
      { id: "agenda", label: "Agenda", content: agenda },
      { id: "speakers", label: "Speakers", content: <p style={{ margin: 0 }}>Four speakers from three services, and a chair.</p> },
      { id: "recordings", label: "Recordings", content: <p style={{ margin: 0 }}>Each session's recording, with captions and a transcript, a week after the event.</p> },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ManyTabs: Story = {
  name: "Many tabs, a narrow box",
  parameters: {
    docs: {
      description: {
        story: "Seven labels in a 20rem box: the row keeps to one line and scrolls sideways, the way section nav does. If a set of tabs needs this on a wide screen, it is probably several pages.",
      },
    },
  },
  args: {
    label: "Report sections",
    defaultSelected: "summary",
    items: ["Summary", "Method", "Findings", "Costs", "Risks", "Next steps", "Appendix"].map((l) => ({
      id: l.toLowerCase().replace(/\s+/g, "-"),
      label: l,
      content: <p style={{ margin: 0 }}>The {l.toLowerCase()} of the report.</p>,
    })),
  },
  argTypes: { defaultSelected: { control: false } },
  render: (args) => (
    <div style={{ maxInlineSize: "20rem" }}>
      <Tabs {...args} />
    </div>
  ),
};
