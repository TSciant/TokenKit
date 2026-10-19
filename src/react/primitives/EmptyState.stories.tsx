import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "04 Primitives/85 Empty state",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          "Where content would be, why there is none, and what to do next, in the place of the empty thing (a table and its headers, not under them). The cause decides the words and the offer: first-use (\"No projects yet\", Create project), configure (\"Configure alerts\"), no-results (exactly \"No results found\" and \"Edit your search and try again.\", nothing louder than Clear filters), cleared (\"No new messages\"), pending (\"You'll see invoices here when …\"), no-access (\"Access permissions needed\", never \"Access denied\") and error (\"Unable to load packs\", Reload, the code as a reference after the description, never in the title). A real heading at its place in the outline; at most two ways on, never the same button the page already shows; no blame, no \"please\", no exclamation marks, never \"No data\". The mark and any picture are decoration. Compact is one sentence, for a card or a sidebar. Left-aligned as one block. Not while loading, and not for an error that needs action now (an Alert). From Pajamas, Paste, PatternFly, Carbon, Orbit, AGDS and Astryx.",
      },
    },
  },
  argTypes: {
    cause: { control: "select", options: ["first-use", "configure", "no-results", "cleared", "pending", "no-access", "error"] },
    size: { control: "inline-radio", options: ["compact", "section", "page"] },
  },
  args: {
    cause: "first-use",
    title: "No saved packs yet",
    description: "To compare themes side by side, save a pack from the playground.",
    action: { label: "Open playground", href: "#main" },
    secondary: { label: "How packs work", href: "#main" },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const EveryCause: Story = {
  name: "Every cause",
  parameters: { docs: { description: { story: "Each cause with its mark, its words and its offer." } } },
  render: () => (
    <div data-shell="stack" data-gap="2">
      <EmptyState cause="first-use" title="No projects yet" description="Projects hold your packs and their releases." action={{ label: "Create project", href: "#main" }} />
      <EmptyState cause="configure" title="Configure alerts" description="Choose what to be told about, and where." action={{ label: "Configure alerts", href: "#main" }} />
      <EmptyState cause="no-results" title="No results found" description="Edit your search and try again." secondary={{ label: "Clear filters", onClick: () => {} }} />
      <EmptyState cause="cleared" title="No new messages" description="To review earlier messages, go to the archive." secondary={{ label: "Go to the archive", href: "#main" }} />
      <EmptyState cause="pending" title="No invoices yet" description="You'll see invoices here when your first month ends." />
      <EmptyState cause="no-access" title="Access permissions needed" description="To see this project, ask its owner to add you." action={{ label: "Return to dashboard", href: "#main" }} />
      <EmptyState cause="error" title="Unable to load packs" description="Check your connection and reload the page." reference="E-503" action={{ label: "Reload page", onClick: () => {} }} />
    </div>
  ),
};

export const Compact: Story = {
  name: "Compact, in a card",
  args: { size: "compact", cause: "cleared", title: "No new comments.", secondary: undefined, action: undefined, description: undefined },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma EmptyState laid over this one: first use, with its mark, title, description and both ways on, 560 wide." } },
    onion: { component: "EmptyState", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 560 }}>
      <EmptyState {...args} />
    </div>
  ),
};
