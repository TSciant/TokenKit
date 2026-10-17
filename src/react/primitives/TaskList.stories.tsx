import type { Meta, StoryObj } from "@storybook/react-vite";
import { TaskList } from "./TaskList";

const meta = {
  title: "04 Primitives/71 Task list",
  component: TaskList,
  parameters: {
    docs: {
      description: {
        component:
          "The parts of a long job, each with where it is, done in any order (GOV.UK's task list). Use for a service or form with sections a reader may come back to. Don't use for stages that must go in order (Steps). Each task's name is a link and its status is the link's description, so a screen reader hears \"Company details, link, In progress\". Completed is plain text; statuses still to do are tags, so what needs doing stands out. A task that cannot start yet is not a link.",
      },
    },
  },
  argTypes: {
    items: { control: "object" },
    words: { control: "object" },
  },
  args: {
    items: [
      { label: "Company details", href: "#company", status: "complete" },
      { label: "Contact details", href: "#contact", status: "in-progress", hint: "Who we should talk to about the application" },
      { label: "Financial history", href: "#finance", status: "not-started" },
      { label: "Supporting documents", href: "#documents", status: "error" },
      { label: "Check and send", status: "cannot-start" },
    ],
  },
} satisfies Meta<typeof TaskList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: "40rem" }}>
      <TaskList {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Task list laid over this one: five tasks, every status, 640 wide." } },
    onion: { component: "TaskList", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 640 }}>
      <TaskList {...args} />
    </div>
  ),
};
