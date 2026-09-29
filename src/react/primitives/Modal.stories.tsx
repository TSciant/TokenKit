import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Modal, ModalTrigger } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";

const meta = {
  title: "04 Primitives/09 Modal",
  component: Modal,
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    docs: {
      description: {
        component:
          "05.09 — Native dialog via showModal(). Escape, backdrop dismiss, focus restore. Enter/exit uses motion tokens. ModalTrigger owns open state for the common CTA compose. Use for short confirmations and request forms — not full page flows. Use for: Short confirms, request forms, and focused tasks that should not leave the page. Don't use for: Full page flows, multi-step journeys, or anything that needs its own URL.",
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: "Slot — composed elements, not text.",
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    closeOnBackdrop: { control: "boolean" },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    open: false,
    onClose: () => {},
    title: "Confirm action",
    size: "md",
    closeOnBackdrop: true,
  },
  render: function Play(args) {
    const [open, setOpen] = useState(false);
    return (
      <div data-shell="stack" data-gap="4" style={{ padding: "var(--tk-space-5)" }}>
        <Button
          data-modal-trigger=""
          size="lg"
          trailing={<Icon name="arrowRight" size="sm" />}
          onClick={() => setOpen(true)}
        >
          Open modal
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={String(args.title)}
          size={(args.size as "sm" | "md" | "lg") || "md"}
          closeOnBackdrop={args.closeOnBackdrop !== false}
          footer={
            <>
              <Button variant="quiet" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Confirm</Button>
            </>
          }
        >
          <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
            Backdrop frosts and fades; the panel rises on --tk-motion-enter.
            Escape closes and returns focus to the trigger.
          </p>
        </Modal>
      </div>
    );
  },
};

export const TriggerCompose: Story = {
  name: "ModalTrigger compose",
  args: {
    open: false,
    onClose: () => {},
    title: "Request a conversation",
    size: "md",
    closeOnBackdrop: true,
  },
  parameters: { controls: { disable: true } },
  render: function TriggerDemo() {
    return (
      <div data-shell="stack" data-gap="5" style={{ padding: "var(--tk-space-5)" }}>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          ModalTrigger owns open state. Drop it next to any CTA.
        </p>
        <div data-shell="inline" data-gap="3" style={{ flexWrap: "wrap" }}>
          <ModalTrigger
            label="Talk to a consultant"
            title="Request a conversation"
            triggerSize="lg"
            size="md"
            footer={function (close) {
              return (
                <>
                  <Button variant="quiet" onClick={close}>
                    Not now
                  </Button>
                  <Button onClick={close}>Send request</Button>
                </>
              );
            }}
          >
            <p style={{ margin: 0 }}>
              Tell us what you are working on. We route you to the right practice
              lead - usually within one business day.
            </p>
          </ModalTrigger>
          <ModalTrigger
            label="Quick note"
            title="Short form"
            triggerVariant="outline"
            size="sm"
            footer={function (close) {
              return (
                <Button size="sm" onClick={close}>
                  Done
                </Button>
              );
            }}
          >
            <p style={{ margin: 0 }}>Compact panel via size=&quot;sm&quot;.</p>
          </ModalTrigger>
        </div>
      </div>
    );
  },
};

/* ---------------------------------------------------------------------------
   ModalTrigger — the button-and-dialog pair, as one component.

   It is what the page compositions actually use: a Modal needs an opener, a
   piece of state and a close handler, and repeating those three at every call
   site is how they drift apart. It has its own controls because it has its own
   props — the trigger's variant and size are not the panel's size.
--------------------------------------------------------------------------- */
export const Trigger: StoryObj<typeof ModalTrigger> = {
  name: "Trigger",
  render: (args) => (
    <div style={{ padding: "var(--tk-space-5)" }}>
      <ModalTrigger {...args} />
    </div>
  ),
  argTypes: {
    label: { control: "text", description: "The opener's label." },
    title: { control: "text", description: "Dialog title; also its accessible name." },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Panel width.",
    },
    triggerVariant: { control: "inline-radio", options: ["solid", "outline", "quiet"] },
    triggerSize: { control: "inline-radio", options: ["sm", "md", "lg"] },
    closeOnBackdrop: { control: "boolean" },
    children: { control: "text", description: "Dialog body." },
    footer: { control: false, description: "Slot, or a function given `close`." },
  },
  args: {
    label: "Talk to a consultant",
    title: "Tell us what you are working on",
    size: "md",
    triggerVariant: "solid",
    triggerSize: "md",
    closeOnBackdrop: true,
    children:
      "Share a short brief. We match you to a practice lead — usually within one business day.",
  },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { open: true, title: "Modal title", onClose: () => {} },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, drawn inside the dialog because a modal lives in the browser's top layer and nothing outside it can be seen through it. The backdrop is left out of the comparison. Switch Onion in the toolbar; size picks the skin." } },
    onion: { component: "Modal", skin: (a: Record<string, unknown>) => `${(a.size as string) ?? "md"}.png` },
  },
  render: (args) => (
    <Modal
      {...args}
      footer={
        <>
          <Button variant="outline">Button</Button>
          <Button>Button</Button>
        </>
      }
    >
      Body copy for the dialog. It explains the decision being asked for.
    </Modal>
  ),
};
