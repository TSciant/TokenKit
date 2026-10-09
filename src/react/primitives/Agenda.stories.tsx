import type { Meta, StoryObj } from "@storybook/react-vite";
import { Agenda } from "./Agenda";

const meta = {
  title: "04 Primitives/47 Agenda",
  component: Agenda,
  parameters: {
    docs: {
      description: {
        component:
          "One event's programme: its sessions in order, each with a time, a title, who leads it, a line on what it covers and one thing to take away. An ordered list, with the times in a column of their own that lines up; on a narrow screen each time sits above its session. Each session's action names the session for a screen reader. A list of events, each its own date, is an event list instead.",
      },
    },
  },
  argTypes: {
    sessions: { control: "object" },
    note: { control: "text" },
    level: { control: "inline-radio", options: [3, 4] },
  },
  args: {
    note: "Times are local to the venue.",
    level: 3,
    sessions: [
      { time: "09:00", title: "Welcome and opening remarks", speakers: ["Jordan Lee, Director"] },
      {
        time: "09:30",
        title: "What changed this year",
        speakers: ["Sam Rivera, Principal", "Alex Chen, Analyst"],
        detail: "The year's main changes, and what they mean for the next one.",
        action: { label: "Slides", href: "#main" },
      },
      { time: "11:00", title: "Break" },
      {
        time: "11:15",
        title: "Working session: planning ahead",
        speakers: ["Taylor Brooks, Consultant"],
        detail: "Small groups, one question each, answers shared at the end.",
        action: { label: "Slides", href: "#main" },
      },
    ],
  },
} satisfies Meta<typeof Agenda>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
