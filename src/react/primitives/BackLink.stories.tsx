import type { Meta, StoryObj } from "@storybook/react-vite";
import { BackLink } from "./BackLink";
import { SkipLink } from "./SkipLink";

const meta = {
  title: "04 Primitives/90 Back link",
  component: BackLink,
  parameters: {
    docs: {
      description: {
        component:
          "One link back to the previous page of a multi-page journey (a form, a transaction), at the top of the page. \"Back\" for a simple journey; \"Go back to [page]\" where Back would not be clear. Always before `<main>`, so the skip link passes over it, and not wrapped in a nav (moving it into a landmark tests worse). A real address that works without JavaScript, never history.back(); as=\"button\" only when going back has to post the form. Back returns them to the page as they left it (unless pre-filling would be a safety or security risk). Never with breadcrumbs, never on content pages, never beside other links or buttons. On a dark band, put it inside the inverse context: it takes the band's inks (4.5:1 with white). From GOV.UK and the NHS service manual.",
      },
    },
  },
  argTypes: {
    children: { control: "text", description: "The words: \"Back\", or \"Go back to [page]\" where Back would not be clear." },
  },
  args: { href: "#main" },
} satisfies Meta<typeof BackLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AtTheTopOfAQuestion: Story = {
  name: "At the top of a question",
  parameters: { docs: { description: { story: "The order on the page: the skip link, the header, the back link, then main with the question." } } },
  render: () => (
    <div data-shell="stack" data-gap="3" style={{ maxInlineSize: "36rem" }}>
      <SkipLink href="#question" />
      <BackLink href="#main" />
      <main id="question" data-shell="stack" data-gap="3">
        <h1 style={{ margin: 0 }}>What is your date of birth?</h1>
      </main>
    </div>
  ),
};

export const OnADarkBand: Story = {
  name: "On a dark band",
  args: { href: "#main" },
  render: () => (
    <div data-on="inverse" style={{ padding: "var(--tk-space-4)" }}>
      <BackLink href="#main">Change my previous answer</BackLink>
    </div>
  ),
};

export const AsAButton: Story = {
  name: "As a button that posts",
  args: { as: "button", name: "action", value: "back" },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { href: "#main" },
  parameters: {
    docs: { description: { story: "The Figma BackLink laid over this one: \"Back\" with its chevron." } },
    onion: { component: "BackLink", skin: () => "default.png" },
  },
};
