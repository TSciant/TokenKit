import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Chip } from "./Chip";

const meta = {
  title: "04 Primitives/02 Chip",
  component: Chip,
  parameters: {
    docs: {
      description: {
        component:
          "Non-interactive by default. Progressive layers: interactive makes it a real button; pressed is the filter/toggle state with aria-pressed. Use for: Compact labels, filters, tags, and type marks in lists or toolbars. Don't use for: Primary actions (use Button), long sentences, or status that needs an Alert.",
      },
    },
  },
  argTypes: {
    emphasis: { control: "inline-radio", options: ["default", "strong", "quiet"] },
    interactive: { control: "boolean" },
    pressed: { control: "boolean" },
  },
  args: { children: "chip" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ProgressiveEnhancement: Story = {
  name: "Progressive enhancement",
  render: () => {
    const [active, setActive] = useState("podcast");
    const types = [
      ["all", "All"],
      ["post", "Blog"],
      ["podcast", "Podcast"],
      ["webinars", "Webinars"],
      ["briefs", "Briefs"],
    ] as const;

    return (
      <div data-shell="stack" data-gap="5">
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Labels first. Interactive filters are an enhancement — without JS you
          still get a readable type row; with JS you get a pressed state.
        </p>
        <div data-shell="stack" data-gap="3">
          <p className="tk-doc-sub">1 · Static labels</p>
          <div data-shell="inline" data-gap="2">
            <Chip>Blog</Chip>
            <Chip emphasis="strong">Podcast</Chip>
            <Chip emphasis="quiet">Archive</Chip>
          </div>
        </div>
        <div data-shell="stack" data-gap="3">
          <p className="tk-doc-sub">2 · Interactive + pressed (insights filters)</p>
          <div
            role="group"
            aria-label="Content type"
            data-shell="inline"
            data-gap="2"
          >
            {types.map(([id, label]) => (
              <Chip
                key={id}
                interactive
                pressed={active === id}
                onClick={() => setActive(id)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    );
  },
};

export const Emphasis: Story = {
  render: () => (
    <div data-shell="inline" data-gap="2">
      <Chip>default</Chip>
      <Chip emphasis="strong">strong</Chip>
      <Chip emphasis="quiet">quiet</Chip>
      <Chip interactive>interactive</Chip>
      <Chip interactive pressed>
        pressed
      </Chip>
    </div>
  ),
};
