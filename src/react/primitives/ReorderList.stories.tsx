import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReorderList, type ReorderItem } from "./ReorderList";

const TEAMS: ReorderItem[] = ["Engineering Team", "Design", "Research", "Support", "Operations"].map((label) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label }));

const meta = {
  title: "04 Primitives/92 Reorder list",
  component: ReorderList,
  parameters: {
    docs: {
      description: {
        component:
          "Put a short list in order, three ways: drag an item by its grip; with the keyboard, focus the grip, press Space or Enter to pick it up, the up and down arrows to move it, Space or Enter to put it down and Escape to put it back where it was; or tap Move up and Move down, which every item has, so nothing needs a drag (WCAG 2.5.7, AA). Each pick-up, move, drop and cancel is said with its position (\"Engineering Team, moved to position 3 of 5\"); the instructions are on the grip; the words can be translated. A lifted item is drawn as raised with a strong edge, not made see-through; where it would land is a line, not a colour. Nothing animates. Undo (Ctrl+Z) belongs to the page. For quick reordering of a short list; when the list is sorted by something, disable it and say why. From Pajamas and Zendesk Garden; WCAG 2.5.7 is quoted from the W3C until it is captured.",
      },
    },
  },
  args: { label: "Team order", items: TEAMS, onReorder: () => {} },
} satisfies Meta<typeof ReorderList>;

export default meta;
type Story = StoryObj<typeof meta>;

function Live() {
  const [items, setItems] = useState(TEAMS);
  return (
    <div style={{ maxInlineSize: "28rem" }}>
      <ReorderList label="Team order" items={items} onReorder={(ids) => setItems(ids.map((id) => items.find((x) => x.id === id)!))} />
    </div>
  );
}

export const Playground: Story = { render: () => <Live /> };

export const Sorted: Story = {
  name: "Sorted, so not reorderable",
  args: { disabled: true, disabledReason: "The teams are sorted by size. Sort them by your own order to move them." },
  render: (args) => <div style={{ maxInlineSize: "28rem" }}><ReorderList {...args} /></div>,
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma ReorderList laid over this one: five teams with their grips and move buttons, 400 wide." } },
    onion: { component: "ReorderList", skin: () => "default.png" },
  },
  render: (args) => <div style={{ inlineSize: 400 }}><ReorderList {...args} /></div>,
};
