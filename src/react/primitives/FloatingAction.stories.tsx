import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { FloatingAction } from "./FloatingAction";
import { ICON_NAMES } from "./Icon";

/* A small page for the action to float over. It is the positioned ancestor
   that `contained` positions against, and it scrolls, so the action can be
   seen staying put while the page moves under it. */
function Frame({ label, tab = false, children }: { label: string; tab?: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        blockSize: "20rem",
        overflow: "hidden",
        border: "1px solid var(--tk-line-default)",
        background: "var(--tk-surface-default)",
      }}
    >
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        style={{
          blockSize: "100%",
          overflowY: "auto",
          /* Room at the end for the button, and at the sides for a tab: the
             page leaves space for what floats over it. */
          padding: tab
            ? "var(--tk-space-5) calc(var(--tk-target-comfortable) + var(--tk-space-4))"
            : "var(--tk-space-5)",
          paddingBlockEnd: "calc(var(--tk-target-comfortable) + var(--tk-space-7))",
        }}
      >
        <div data-shell="stack" data-gap="3" style={{ maxInlineSize: "var(--tk-measure)" }}>
          <h2 data-text="heading-s" style={{ margin: 0 }}>
            Opening hours
          </h2>
          <p style={{ margin: 0 }}>
            We're open from nine until six on weekdays and from ten until four on Saturdays. On bank
            holidays the hours change; the week before, they are posted here.
          </p>
          <p style={{ margin: 0 }}>
            Parking is behind the building, and the entrance on that side has a ramp. If you need a
            hand with anything when you arrive, ask at the front desk.
          </p>
          <p style={{ margin: 0 }}>
            Deliveries come to the side door between eight and ten. Anything that arrives later is
            held at the desk until the end of the day.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

const meta = {
  title: "04 Primitives/56 Floating action",
  component: FloatingAction,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "One primary action that floats over the page: a round button in the corner, or a tab on the page's edge with its label set vertically. For the one thing a reader should be able to do from anywhere (start a chat, write a new message, get in touch), one per page. The label is always the accessible name: visually hidden on the round button unless `extended`, set along the edge on the tab. It keeps clear of a phone's notch and home indicator, adds its height to the page's scroll padding so focus is not hidden under it, and on a narrow screen the tab becomes the round button. These stories use `contained`, which positions it in the frame instead of the viewport. Use for: one page-wide action. Don't use for: an action that belongs to one section, or a second floating anything.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    icon: { control: "select", options: ICON_NAMES },
    href: { control: "text" },
    onClick: { action: "click" },
    variant: { control: "inline-radio", options: ["button", "tab"] },
    extended: { control: "boolean" },
    position: { control: "inline-radio", options: ["end", "start"] },
    contained: { control: "boolean" },
  },
  args: {
    label: "Start a chat",
    icon: "message",
    variant: "button",
    extended: false,
    position: "end",
    contained: true,
  },
  render: (args) => (
    <Frame label="Example page">
      <FloatingAction {...args} />
    </Frame>
  ),
} satisfies Meta<typeof FloatingAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Extended: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`extended` shows the label beside the icon: wider, plainer, and easier to hit, at the cost of covering more of the page. Without an icon the label always shows. Here it is a link (`href`), so it works without script.",
      },
    },
  },
  args: { label: "New message", icon: "edit", extended: true, href: "#new-message" },
};

export const SideTab: Story = {
  name: "Side tab",
  parameters: {
    docs: {
      description: {
        story:
          "`variant=\"tab\"`: a tab flush to the page's edge, halfway up, its label set along the edge with the tops of the letters towards it. Square on the edge, round on the two corners facing the page. On a screen 40rem or narrower it becomes the round button, because a tab across a phone's edge covers the text beside it. Shown at both edges.",
      },
    },
  },
  args: { label: "Ready to talk?", icon: "messages", variant: "tab", href: "#contact" },
  render: (args) => (
    <div data-shell="stack" data-gap="5">
      <Frame label="Example page, tab at the end" tab>
        <FloatingAction {...args} />
      </Frame>
      <Frame label="Example page, tab at the start" tab>
        <FloatingAction {...args} position="start" />
      </Frame>
    </div>
  ),
};
