import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Chip } from "./Chip";
import { Icon } from "./Icon";

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
    tone: { control: "inline-radio", options: ["neutral", "info", "success", "warning", "danger"] },
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

/** Status: a tone, a word and an icon. */
export const StatusTones: Story = {
  name: "Status tones",
  parameters: {
    docs: {
      description: {
        story:
          "A status chip: the pack's status colours, always a word, with an icon where it helps, and never a control. Colour alone means nothing to some readers, so \"Closed\" says closed in words and with its icon in any pack, in forced colours and in greyscale. Drawn from a members' message board's thread marks and GOV.UK's and Primer's tags.",
      },
    },
  },
  render: () => (
    <div data-shell="inline" data-gap="2">
      <Chip tone="info" leading={<Icon name="calendar" size="sm" />}>12 March</Chip>
      <Chip tone="success" leading={<Icon name="check" size="sm" />}>Open</Chip>
      <Chip tone="warning" leading={<Icon name="barChart" size="sm" />}>Poll</Chip>
      <Chip tone="danger" leading={<Icon name="ban" size="sm" />}>Closed to replies</Chip>
      <Chip leading={<Icon name="pin" size="sm" />}>Pinned</Chip>
    </div>
  ),
};

const TONE_ICON = { info: "calendar", success: "check", warning: "barChart", danger: "ban" } as const;

/** A status chip per tone, for the Figma status chips to be laid over. */
export const OnionSkinTone: Story = {
  name: "Onion skin: tones (Figma)",
  args: { tone: "warning", children: "Poll" },
  parameters: {
    docs: { description: { story: "The Figma status chips laid over this one: tone in Controls picks the matching variant. Each carries its icon." } },
    onion: { component: "ChipTone", skin: (a: Record<string, unknown>) => `${(a.tone as string) ?? "info"}.png` },
  },
  render: (args) => {
    const tone = (args.tone ?? "info") as keyof typeof TONE_ICON;
    return <Chip {...args} tone={tone} leading={<Icon name={TONE_ICON[tone] ?? "info"} size="sm" />} />;
  },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { children: "Chip" },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one. Switch Onion in the toolbar; emphasis, pressed and interactive in Controls pick the matching skin. An interactive chip is 30px tall against 26: it inherits the body line height." } },
    onion: {
      component: "Chip",
      skin: (a: Record<string, unknown>) => `${(a.emphasis as string) ?? "default"}-${a.pressed ? "true" : "false"}-default-${a.interactive ? "true" : "false"}.png`,
    },
  },
};
