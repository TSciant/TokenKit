import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { MenuButton, type MenuButtonItem } from "./MenuButton";

const ITEMS: MenuButtonItem[] = [
  { label: "Release notes", href: "#release-notes" },
  { label: "Accessibility statement", href: "#accessibility", current: true },
  { label: "Licensing", href: "#licensing" },
  { label: "Contact support", href: "#support" },
];

const meta = {
  title: "04 Primitives/28 Menu button",
  component: MenuButton,
  parameters: {
    docs: {
      description: {
        component:
          "A button that opens a short list of links or actions. Use for: a handful of related destinations or actions behind one control (More, Share, Account), where a mega menu would be a whole panel for six links. Don't use for: the site's primary navigation, a long or grouped list (use a mega menu or the rail nav), or choosing a value (that is a select). It is the disclosure pattern, not role=menu: the trigger has aria-expanded and the items are ordinary links and buttons, so Tab moves through them as everywhere else. Escape and a click outside close it; the arrow keys move between items.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    items: { control: "object" },
    align: { control: "inline-radio", options: ["start", "end"] },
    variant: { control: "inline-radio", options: ["solid", "outline", "quiet"] },
    initialOpen: { control: "boolean" },
  },
  args: { label: "More", items: ITEMS, align: "start", variant: "outline", initialOpen: false },
} satisfies Meta<typeof MenuButton>;

/* Room for the list to open into, with the trigger at the top left. Per story rather
   than on the meta: the Onion story measures its own first box, and a padded frame
   around it would be the box measured. */
const room: Decorator = (Story) => <div style={{ padding: 24, minBlockSize: 280, display: "flex", alignItems: "flex-start", justifyContent: "flex-start" }}><Story /></div>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { decorators: [room] };

export const Open: Story = {
  decorators: [room],
  args: { initialOpen: true },
  parameters: { docs: { description: { story: "Open on first render. The panel's corner is concentric with its items': the panel's radius minus the gap between them." } } },
};

export const AlignedToTheEnd: Story = {
  name: "Aligned to the end",
  args: { initialOpen: true, align: "end", variant: "quiet" },
  parameters: { docs: { description: { story: "At the end of a row, the list lines up with the trigger's right edge so it opens inward instead of off the page." } } },
  decorators: [(Story) => <div style={{ padding: 24, minBlockSize: 280, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", inlineSize: 480 }}><Story /></div>],
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { initialOpen: false },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, closed and open. The open skin includes the list, so the frame is as tall as the list under the trigger. Switch Onion in the toolbar." } },
    onion: { component: "MenuButton", target: "root", skin: (a: Record<string, unknown>) => (a.initialOpen ? "open.png" : "closed.png") },
  },
  decorators: [
    (Story, context) => (
      <div style={{ inlineSize: context.args.initialOpen ? 203 : 79, blockSize: context.args.initialOpen ? 210 : 36 }}>
        <Story />
      </div>
    ),
  ],
};
