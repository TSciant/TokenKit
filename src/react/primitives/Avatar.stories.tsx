import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./Avatar";

const meta = {
  title: "04 Primitives/40 Avatar",
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          "Someone's photo, or their initials (first and last name) on the pack's inverse surface when there is none or it fails to load. Never a silhouette: forty identical grey heads say \"unknown person\" forty times. A circle is a person; square is an organisation, a team or a bot. On its own it is an image named for the person, so a screen reader hears who it is; beside their written name, set decorative so the name is heard once. label overrides what is heard (\"your puppet\"). Drawn from a members' message board built on the kit, Primer, Atlassian and Fluent.",
      },
    },
  },
  argTypes: {
    name: { control: "text" },
    src: { control: "text" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    shape: { control: "inline-radio", options: ["circle", "square"] },
    label: { control: "text" },
    decorative: { control: "boolean" },
  },
  args: { name: "Mary Ellen Doyle", size: "md", shape: "circle" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SizesAndShapes: Story = {
  name: "Sizes and shapes",
  parameters: { docs: { description: { story: "32, 48 and 64px; a circle for people, a square for organisations, teams and bots. Standing alone, each is heard as an image with the name." } } },
  render: () => (
    <div data-shell="inline" data-gap="4" data-align="center">
      <Avatar name="Mary Ellen Doyle" size="sm" />
      <Avatar name="Mary Ellen Doyle" />
      <Avatar name="Mary Ellen Doyle" size="lg" />
      <Avatar name="Class of 1961" shape="square" size="sm" />
      <Avatar name="Class of 1961" shape="square" />
      <Avatar name="Class of 1961" shape="square" size="lg" />
    </div>
  ),
};

export const WithAName: Story = {
  name: "Beside a name",
  parameters: { docs: { description: { story: "The usual case: the name is beside it, so the avatar is set decorative and a screen reader hears the name once. A photo that fails to load (the second row) falls back to initials." } } },
  render: () => (
    <ul data-shell="stack" data-gap="3" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {[
        ["Mary Ellen Doyle", null],
        ["Joe Fitzgerald", "/does-not-exist.jpg"],
        ["Sam", null],
      ].map(([name, src]) => (
        <li key={name} data-shell="row" data-gap="3" data-align="center">
          <Avatar name={name as string} src={src} decorative />
          <span>{name}</span>
        </li>
      ))}
    </ul>
  ),
};

/** One avatar per size and shape, for the Figma Avatar set to be laid over. */
export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Avatar laid over this one: size and shape in Controls pick the matching variant." } },
    onion: { component: "Avatar", skin: (a: Record<string, unknown>) => `${(a.size as string) ?? "md"}-${(a.shape as string) ?? "circle"}.png` },
  },
};
