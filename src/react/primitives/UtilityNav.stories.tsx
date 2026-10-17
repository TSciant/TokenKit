import type { Meta, StoryObj } from "@storybook/react-vite";
import { UtilityNav } from "./UtilityNav";

const meta = {
  title: "04 Primitives/73 Utility nav",
  component: UtilityNav,
  parameters: {
    docs: {
      description: {
        component:
          "A short row of small links above the primary navigation: contact, careers, a portal, log in. Use for the few links every page carries that are not what the site is about. Don't use for the site's sections (the primary navigation), more than five or six links (the footer), or anything a reader must see first. A navigation landmark named Utility, so a screen reader tells it apart from the primary one; links underlined like every link in the kit; the current page's link loses its underline and takes the primary ink and a heavier weight, a change of shape as well as colour. It keeps to the end edge and wraps on a narrow screen. In a SiteHeader it goes in the `utility` slot, above the bar: the general before the specific.",
      },
    },
  },
  argTypes: {
    links: { control: "object" },
    label: { control: "text" },
    align: { control: "inline-radio", options: ["start", "end"] },
    end: { control: false },
  },
  args: {
    label: "Utility",
    align: "end",
    links: [
      { label: "Contact", href: "#contact" },
      { label: "Careers", href: "#careers" },
      { label: "Customer portal", href: "#portal" },
      { label: "Log in", href: "#log-in" },
    ],
  },
} satisfies Meta<typeof UtilityNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SignedIn: Story = {
  name: "Signed in",
  parameters: {
    docs: {
      description: {
        story:
          "Once someone is signed in, the `end` slot says who, with Sign out beside it. Log in leaves the links; the account page joins them, here as the page being read.",
      },
    },
  },
  args: {
    links: [
      { label: "Contact", href: "#contact" },
      { label: "Careers", href: "#careers" },
      { label: "Your account", href: "#account", current: true },
    ],
    end: (
      <>
        <span>Signed in as Sam Ortiz</span>
        <a data-tk="utility-nav-link" href="#sign-out">
          Sign out
        </a>
      </>
    ),
  },
};

export const Start: Story = {
  name: "At the start edge",
  args: { align: "start" },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Utility nav laid over this one: four links at the end edge, 640 wide." } },
    onion: { component: "UtilityNav", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 640 }}>
      <UtilityNav {...args} />
    </div>
  ),
};
