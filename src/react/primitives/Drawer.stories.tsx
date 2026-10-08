import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { ChoiceCardGroup } from "./ChoiceCard";
import { Drawer, DrawerPanel, type DrawerProps } from "./Drawer";
import { Field } from "./Field";

const FILTER_ACTIONS = [{ label: "Clear", variant: "outline" as const }, { label: "Show 24 results", variant: "solid" as const }];

function Filters() {
  return (
    <div data-shell="stack" data-gap="5">
      <Field
        label="Sort by"
        control="select"
        options={[
          { value: "new", label: "Newest first" },
          { value: "price", label: "Price, low to high" },
        ]}
      />
      <ChoiceCardGroup
        legend="Size"
        name="drawer-size"
        type="checkbox"
        columns={1}
        options={[
          { value: "s", title: "Small", meta: "8" },
          { value: "m", title: "Medium", meta: "11" },
          { value: "l", title: "Large", meta: "5" },
        ]}
      />
    </div>
  );
}

/* A drawer with the button that opens it; the story's args are the drawer's. */
function Opener({ label = "Filters", ...args }: Partial<DrawerProps> & { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Drawer title="Filters" actions={FILTER_ACTIONS} {...args} open={open} onClose={() => setOpen(false)}>
        {args.children ?? <Filters />}
      </Drawer>
    </>
  );
}

const meta = {
  title: "04 Primitives/37 Drawer",
  component: Drawer,
  parameters: {
    docs: {
      description: {
        component:
          "A panel from the edge of the screen, on the native dialog, with Modal's anatomy: title, a body that scrolls between a fixed header and footer, actions, Close. Focus moves in when it opens and back to the opener when it closes. `side` end (the default) is for what belongs to the page in view: filters, details, a quick preview; start is for navigation and only that; bottom is a sheet. On a phone a side drawer comes up from the bottom. Modal by default, so the page behind waits; `modal={false}` leaves the page usable beside it, for something worked alongside (an assistant, a cart). Use for: filters, details, short settings, a companion panel. Don't use for: create and edit flows (use a page) or two drawers at once.",
      },
    },
  },
  argTypes: {
    open: { control: false },
    onClose: { action: "close" },
    title: { control: "text" },
    description: { control: "text" },
    children: { control: false },
    actions: { control: "object" },
    footer: { control: false },
    side: { control: "inline-radio", options: ["end", "start", "bottom"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    modal: { control: "boolean" },
    closeOnBackdrop: { control: "boolean" },
  },
  args: {
    open: false,
    onClose: () => {},
    title: "Filters",
    description: "Narrow the list; the count on the button says how many are left.",
    actions: FILTER_ACTIONS,
    side: "end",
    size: "md",
    modal: true,
  },
  render: (args) => <Opener {...args} />,
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Edges: Story = {
  parameters: {
    docs: { description: { story: "End for filters and details, start for navigation, bottom for a sheet of choices. Each is modal: the page waits." } },
  },
  render: () => (
    <div data-shell="inline" data-gap="3">
      <Opener label="Filters (end)" />
      <Opener label="Menu (start)" side="start" size="sm" title="Menu" description={undefined} actions={undefined}>
        <nav aria-label="Menu">
          <ul data-shell="stack" data-gap="3" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {["Overview", "Components", "Patterns", "Tokens"].map((l) => (
              <li key={l}>
                <a href={`#${l.toLowerCase()}`}>{l}</a>
              </li>
            ))}
          </ul>
        </nav>
      </Opener>
      <Opener label="Share (bottom)" side="bottom" title="Share this page" description={undefined} actions={[{ label: "Done", variant: "solid" }]}>
        <div data-shell="inline" data-gap="2">
          <Button variant="outline">Copy link</Button>
          <Button variant="outline">Email</Button>
          <Button variant="outline">Print</Button>
        </div>
      </Opener>
    </div>
  ),
};

export const NonModal: Story = {
  name: "Non-modal",
  parameters: {
    docs: { description: { story: "modal={false}: the page stays usable beside the drawer. Count up on the page with the drawer open; Escape or Close still closes it, and Tab can leave it." } },
  },
  render: () => {
    function Page() {
      const [n, setN] = useState(0);
      return (
        <div data-shell="stack" data-gap="3" style={{ maxInlineSize: "24rem" }}>
          <p style={{ margin: 0 }}>The page, still usable: {n}</p>
          <div data-shell="inline" data-gap="2">
            <Button variant="outline" onClick={() => setN((c) => c + 1)}>
              Count up
            </Button>
            <Opener label="Open notes" modal={false} title="Notes" description="Kept beside the page while you work." actions={undefined}>
              <p style={{ margin: 0 }}>A drawer that doesn't block the page is for something you work alongside, not something that needs an answer first.</p>
            </Opener>
          </div>
        </div>
      );
    }
    return <Page />;
  },
};

/** The panel in place at 448 by 560, for the Figma Drawer to be laid over. */
export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "A drawer's panel drawn in place (DrawerPanel), 448 wide and 560 tall, with filters and two actions, for the Figma Drawer to be laid over." } },
    onion: { component: "Drawer", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div style={{ inlineSize: 448, blockSize: 560, display: "flex" }}>
      <DrawerPanel title="Filters" description="Narrow the list; the count on the button says how many are left." actions={FILTER_ACTIONS}>
        <Field
          label="Sort by"
          control="select"
          options={[
            { value: "new", label: "Newest first" },
            { value: "price", label: "Price, low to high" },
          ]}
        />
      </DrawerPanel>
    </div>
  ),
};
