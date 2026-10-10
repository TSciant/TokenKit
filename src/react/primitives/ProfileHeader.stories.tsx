import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProfileHeader } from "./ProfileHeader";

const meta = {
  title: "04 Primitives/54 Profile header",
  component: ProfileHeader,
  parameters: {
    docs: {
      description: {
        component:
          "The top of a person's own page: who they are, what they do and where, how to reach them, a few paragraphs about them and what they know about. The name is the page's heading, with any letters after it in a lighter weight. The portrait sits in a narrow column beside the details when the container has room and above them, smaller, when it does not (a container query, so a profile in a sidebar stacks). Email and phone are real links; every icon is decoration with its kind spoken as a word. A grid of people is a card collection that links here.",
      },
    },
  },
  argTypes: {
    name: { control: "text" },
    credentials: { control: "text" },
    role: { control: "text" },
    organisation: { control: "text" },
    location: { control: "text" },
    portrait: { control: false, description: "A photograph. Defaults to a portrait plate standing in for one." },
    contacts: { control: "object" },
    bio: { control: "object" },
    expertise: { control: "object" },
    expertiseLabel: { control: "text" },
    back: { control: "object" },
    level: { control: "inline-radio", options: [1, 2] },
  },
  args: {
    name: "Jordan Rivera",
    credentials: "PhD, AICP",
    role: "Head of research",
    organisation: "Riverside Planning Studio",
    location: "Springfield",
    contacts: {
      email: "j.rivera@example.com",
      phone: "+1 555 010 0177",
      links: [{ label: "Book a meeting", href: "#main" }],
    },
    bio: [
      "Jordan leads the studio's research team, and has spent fifteen years asking people how they get around their towns, most of them in the towns the studio now plans for.",
      "Before that they ran a public consultation programme that four neighbouring councils still use, and they still lead two of its workshops a year.",
    ],
    expertise: ["Urban planning", "Public consultation", "Transport research", "Survey design"],
    expertiseLabel: "Expertise",
    back: { label: "All staff", href: "#main" },
    level: 1,
  },
} satisfies Meta<typeof ProfileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const NarrowContainer: Story = {
  name: "Narrow container",
  parameters: {
    docs: {
      description: {
        story:
          "The same profile in a container 22rem wide. The query is on the container, not the window, so the portrait moves above the details and shrinks to a headshot here even on a wide screen.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: "22rem" }}>
        <Story />
      </div>
    ),
  ],
};

export const NameAndRole: Story = {
  name: "Name and role only",
  parameters: {
    docs: {
      description: {
        story:
          "Only what is required: a name and a role, with the portrait plate. As a section of another page, so the name is an h2. Everything else appears when it is given.",
      },
    },
  },
  args: {
    name: "Sam Okafor",
    credentials: undefined,
    role: "Senior researcher",
    organisation: undefined,
    location: undefined,
    contacts: undefined,
    bio: undefined,
    expertise: undefined,
    back: undefined,
    level: 2,
  },
};
