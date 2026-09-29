import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const Arrow = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M2 8h11M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Search = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10.5 10.5 14 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const Plus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M8 3v10M3 8h10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const meta = {
  title: "04 Primitives/01 Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          "05.01 — Primary actions. Variants solid / outline / quiet. Size sm|md|lg. Bound icon: pass `icon` + `iconPosition` (leading|trailing); or compose with `leading` / `trailing`. Icon-only when there is no label — set `aria-label`. On a scrim, pack tokens supply the pair. Prefer solid for the single conversion on a hero; quiet for tertiary. Use for: Primary and secondary actions, form submits, in-page CTAs, header Contact, icon CTAs and icon-only chrome. Don't use for: Navigation between pages (use a link), long explanatory copy, more than one solid CTA in the same cluster, or icon-only without an accessible name.",
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["solid", "outline", "quiet"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    full: { control: "boolean" },
    disabled: { control: "boolean" },
    busy: { control: "boolean" },
    href: { control: "text" },
    iconPosition: {
      control: "inline-radio",
      options: ["leading", "trailing"],
    },
    icon: { control: false },
    leading: { control: false },
    trailing: { control: false },
  },
  args: { children: "Action" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { children: "Button" },
  parameters: {
    docs: {
      description: {
        story:
          "The Figma component laid over this one. Switch Onion in the toolbar to Overlay, Difference or Split; vary variant, size and disabled in Controls and the skin follows. The skin is a 1x export of the matching Figma variant, so what you see is whether a CSS pixel and a design pixel coincide. Off by default; nothing in the component imports it.",
      },
    },
    onion: {
      component: "Button",
      skin: (a: Record<string, unknown>) =>
        `${(a.variant as string) ?? "solid"}-${(a.size as string) ?? "md"}-${a.disabled ? "disabled" : "default"}.png`,
    },
  },
};

export const WithIcon: Story = {
  name: "With icon",
  parameters: {
    docs: {
      description: {
        story:
          "Bound `icon` + `iconPosition` (default leading). Same look as the open `leading` / `trailing` slots — one prop when you only need one glyph.",
      },
    },
  },
  render: (args) => (
    <div data-shell="stack" data-gap="4">
      <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
        <Button {...args} icon={<Search />} iconPosition="leading">
          Search
        </Button>
        <Button
          {...args}
          variant="outline"
          icon={<Arrow />}
          iconPosition="trailing"
        >
          Continue
        </Button>
        <Button {...args} variant="quiet" leading={<Plus />}>
          Add item
        </Button>
      </div>
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Flip `iconPosition` in Controls on Playground after binding an icon in
        code, or use this story as the recipe.
      </p>
    </div>
  ),
};

export const IconOnly: Story = {
  name: "Icon only",
  parameters: {
    docs: {
      description: {
        story:
          "Pass `icon` with no children. Sets `data-icon` for square padding. Always provide `aria-label` (or `aria-labelledby`).",
      },
    },
  },
  render: () => (
    <div data-shell="inline" data-gap="2">
      <Button icon={<Search />} aria-label="Search" />
      <Button icon={<Plus />} variant="outline" aria-label="Add" size="sm" />
      <Button icon={<Arrow />} variant="quiet" aria-label="Next" size="lg" />
    </div>
  ),
};

export const ProgressiveEnhancement: Story = {
  name: "Progressive enhancement",
  parameters: {
    docs: {
      description: {
        story:
          "Baseline is a native button. Add href to get a real link (works without JS). Add icon/trailing for the arrow CTA pattern. Add busy for async — still a disabled control if JS never flips it back.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="5">
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Each row adds one progressive layer. The leftmost control is always the
        graceful baseline.
      </p>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">1 — Baseline button</p>
        <Button>Send</Button>
      </div>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">2 — Real link (no JS required)</p>
        <Button href="#contact" variant="outline">
          Contact us
        </Button>
      </div>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">3 — Bound trailing icon (arrow CTA)</p>
        <Button size="lg" icon={<Arrow />} iconPosition="trailing">
          Why tokens first
        </Button>
      </div>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">4 — Busy enhancement</p>
        <div data-shell="inline" data-gap="2">
          <Button>Idle</Button>
          <Button busy>Saving</Button>
        </div>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div data-shell="inline" data-gap="2">
      <Button>Solid</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="quiet">Quiet</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div data-shell="inline" data-gap="2">
      <Button size="sm">Small</Button>
      <Button>Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const FullWidth: Story = {
  args: { full: true, children: "Full width" },
};
