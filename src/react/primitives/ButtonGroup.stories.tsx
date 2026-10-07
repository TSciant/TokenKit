import type { Meta, StoryObj } from "@storybook/react-vite";
import { ButtonGroup, type ButtonGroupAction } from "./ButtonGroup";

const SAVE: ButtonGroupAction[] = [
  { label: "Cancel", variant: "quiet" },
  { label: "Save changes" },
];

const MANY: ButtonGroupAction[] = [
  { label: "Publish" },
  { label: "Preview", variant: "outline" },
  { label: "Duplicate" },
  { label: "Export" },
  { label: "Archive" },
];

const meta = {
  title: "04 Primitives/31 Button group",
  component: ButtonGroup,
  parameters: {
    docs: {
      description: {
        component:
          "Two or three related actions, and the rule for the rest: past `max` (three at most) the remainder goes behind a More menu instead of becoming a fourth button. One solid button per group; the others outline or quiet. Order is reading order at every width: a group aligned to the end is written \"Cancel, Save\", and in a narrow box it stacks full width in that order rather than reversing, so focus order and reading order never disagree. `equal` makes every button as wide as the widest label. Keep destructive actions visible: a menu item cannot carry a tone. Use for: form footers, dialog actions, the actions on a card. Don't use for: navigation (links), a toolbar of many small controls, or exclusive choices (a segmented control).",
      },
    },
  },
  args: { label: "Form actions", actions: SAVE },
  argTypes: {
    align: { control: "inline-radio", options: ["start", "end"] },
    max: { control: "inline-radio", options: [2, 3] },
    equal: { control: "boolean" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    actions: { control: "object" },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const DialogFooter: Story = {
  name: "End-aligned, equal (a dialog footer)",
  args: { align: "end", equal: true },
  decorators: [(Story) => <div style={{ maxInlineSize: 480, padding: "var(--tk-space-4)", border: "1px dashed var(--tk-line-default)" }}><Story /></div>],
};

export const Overflow: Story = {
  name: "Five actions, three shown",
  args: { label: "Page actions", actions: MANY },
  decorators: [(Story) => <div style={{ paddingBlockEnd: "12rem" }}><Story /></div>],
};

export const Destructive: Story = {
  name: "With a destructive action",
  args: {
    label: "Project actions",
    actions: [
      { label: "Keep project", variant: "quiet" },
      { label: "Delete project", tone: "danger" },
    ],
    align: "end",
  },
};

export const Narrow: Story = {
  name: "In a narrow box (stacks)",
  args: { actions: [{ label: "Save changes" }, { label: "Save as draft", variant: "outline" }, { label: "Cancel", variant: "quiet" }] },
  decorators: [(Story) => <div style={{ inlineSize: 280 }}><Story /></div>],
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { align: "end", equal: true },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one: the dialog-footer group at 480px. Switch Onion in the toolbar." } },
    onion: { component: "ButtonGroup", target: "root", skin: () => "default.png" },
  },
  decorators: [(Story) => <div style={{ maxInlineSize: 480 }}><Story /></div>],
};
