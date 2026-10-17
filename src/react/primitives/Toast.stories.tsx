import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useState } from "react";
import { Button } from "./Button";
import { ToastRegion, type ToastItem } from "./Toast";

const SAMPLE: ToastItem[] = [
  { id: "saved", tone: "success", title: "Changes saved", message: "Your profile is up to date." },
  { id: "invite", tone: "info", title: "Invite sent to Dana Okafor", action: <Button size="sm" variant="outline">Undo</Button> },
  { id: "offline", tone: "warning", title: "You're offline", message: "We'll send your reply when you're back online." },
];

const meta = {
  title: "04 Primitives/65 Toast",
  component: ToastRegion,
  parameters: {
    docs: {
      description: {
        component:
          "A short message about something that just happened, that steps aside on its own or when dismissed. Use for the result of an action the reader just took (\"Saved\", \"Invite sent\"). Don't use for anything a reader must act on or must not miss (an Alert, in the page), or for errors in a form. A polite live region that is always in the page, so a toast is read out without moving focus. Leaving by itself is opt-in (`timeout`, at least six seconds, paused while a pointer or focus is on it) and never for a warning, a danger or a toast with an action, which wait for the reader (WCAG 2.2.1). The tone is in the icon and the rule down its edge, never in colour alone.",
      },
    },
  },
  argTypes: {
    toasts: { control: "object" },
    onDismiss: { action: "dismissed" },
    label: { control: "text" },
    placement: { control: "inline-radio", options: ["block-end", "block-start", "static"] },
    dismissLabel: { control: "text" },
  },
  args: { toasts: SAMPLE, placement: "static", label: "Notifications", dismissLabel: "Dismiss", onDismiss: () => {} },
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: "24rem" }}>
      <ToastRegion {...args} />
    </div>
  ),
};

export const Live: Story = {
  name: "Raised by an action",
  parameters: {
    docs: {
      description: {
        story:
          "The region is always there; pressing the button adds a toast to it, which a screen reader reads without focus moving. This one leaves after six seconds unless a pointer or focus is on it. The stack is fixed to the end of the viewport.",
      },
    },
  },
  render: (args) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
    return (
      <div>
        <Button onClick={() => setToasts((t) => [...t, { id: String(Date.now()), tone: "success", title: "Draft saved", timeout: 6000 }])}>Save draft</Button>
        <ToastRegion {...args} placement="block-end" toasts={toasts} onDismiss={dismiss} />
      </div>
    );
  },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Toast laid over this one: three tones, static, 384 wide." } },
    onion: { component: "Toast", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 384 }}>
      <ToastRegion {...args} placement="static" />
    </div>
  ),
};
