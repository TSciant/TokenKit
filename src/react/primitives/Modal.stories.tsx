import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Modal, ModalPanel, ModalTrigger } from "./Modal";
import { Alert } from "./Alert";
import { Field } from "./Field";
import { Guidance, GuidancePair } from "./Guidance";
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
    closeOnBackdrop: { control: "boolean", description: "Unset: closes on a backdrop click only when there is no footer." },
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
          closeOnBackdrop={args.closeOnBackdrop}
          actions={[
            { label: "Cancel", variant: "quiet", onSelect: () => setOpen(false) },
            { label: "Confirm", onSelect: () => setOpen(false) },
          ]}
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
    closeOnBackdrop: { control: "boolean", description: "Unset: closes on a backdrop click only when there is no footer." },
    children: { control: "text", description: "Dialog body." },
    footer: { control: false, description: "Slot, or a function given `close`." },
  },
  args: {
    label: "Talk to a consultant",
    title: "Tell us what you are working on",
    size: "md",
    triggerVariant: "solid",
    triggerSize: "md",
    children:
      "Share a short brief. We match you to a practice lead — usually within one business day.",
  },
};

/**
 * A long body scrolls; the title and the actions stay where they are.
 */
export const LongContent: Story = {
  name: "Long content (body scrolls)",
  args: { open: false, onClose: () => {}, title: "Terms of the trial" },
  parameters: {
    docs: {
      description: {
        story:
          "When the body is longer than the screen, only the body scrolls: the title stays at the top and the actions at the bottom, so the reader never has to scroll to find how to answer. This modal has a footer, so a click on the backdrop does not close it; Escape, Close and the buttons do.",
      },
    },
  },
  render: function Long() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: "var(--tk-space-5)" }}>
        <Button onClick={() => setOpen(true)}>Read the terms</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Terms of the trial"
          actions={[
            { label: "Not now", variant: "quiet", onSelect: () => setOpen(false) },
            { label: "Start the trial", onSelect: () => setOpen(false) },
          ]}
        >
          <div data-shell="stack" data-gap="3">
            {Array.from({ length: 14 }, (_, i) => (
              <p key={i} style={{ margin: 0 }}>
                {i + 1}. The trial lasts thirty days and can be ended at any time from the account page. Nothing is charged during it, and nothing is charged after it unless a plan is chosen.
              </p>
            ))}
          </div>
        </Modal>
      </div>
    );
  },
};

/**
 * A confirmation that cannot be undone: an alert dialog with the consequence
 * as its description.
 */
export const Confirmation: Story = {
  name: "Confirmation (alert dialog)",
  args: { open: false, onClose: () => {}, title: "Delete this project?" },
  parameters: {
    docs: {
      description: {
        story:
          "`alert` makes it an alert dialog, the kind that interrupts on purpose; `description` puts the consequence under the title, and both are read when it opens. The title is the question, the buttons answer it in its own words, and the destructive one carries the danger tone. It has a footer, so a click outside does not close it.",
      },
    },
  },
  render: function Confirm() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: "var(--tk-space-5)" }}>
        <Button tone="danger" variant="outline" onClick={() => setOpen(true)}>Delete project</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          alert
          size="sm"
          title="Delete this project?"
          description="Its pages, packs and history are deleted for everyone, and cannot be recovered."
          actions={[
            { label: "Keep project", variant: "quiet", onSelect: () => setOpen(false) },
            { label: "Delete project", tone: "danger", onSelect: () => setOpen(false) },
          ]}
        />
      </div>
    );
  },
};

/**
 * A decision that has to be made: no Close, no Escape, no click outside.
 */
export const ForcedDecision: Story = {
  name: "Forced decision (not dismissible)",
  args: { open: false, onClose: () => {}, title: "Your session is about to end" },
  parameters: {
    docs: {
      description: {
        story:
          "`dismissible={false}` takes away Close, Escape and the click outside, so the only ways out are the actions. Use it where carrying on without an answer would lose something, like a session about to time out, and almost never otherwise; both actions close it.",
      },
    },
  },
  render: function Forced() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: "var(--tk-space-5)" }}>
        <Button variant="outline" onClick={() => setOpen(true)}>Show the timeout warning</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          dismissible={false}
          size="sm"
          title="Your session is about to end"
          description="You have been inactive for a while. To keep what you have entered, stay signed in."
          actions={[
            { label: "Sign out", variant: "quiet", onSelect: () => setOpen(false) },
            { label: "Stay signed in", onSelect: () => setOpen(false) },
          ]}
        />
      </div>
    );
  },
};

/**
 * ModalPanel: the panel a Modal draws, shown in the page instead of over it.
 */
export const PanelInPlace: Story = {
  name: "Panel in place (ModalPanel)",
  args: {
    open: false,
    onClose: () => {},
    title: "Create access group",
    description: "Members of the group can edit every page in the project.",
    size: "sm",
    dismissible: true,
  },
  argTypes: {
    onDismiss: { action: "dismiss", description: "Close was pressed. Inside Modal this closes the dialog." },
    ids: { control: "object", description: "Element ids for the dialog's aria wiring; Modal supplies them." },
  } as never,
  parameters: {
    docs: {
      description: {
        story:
          "`ModalPanel` is the panel a Modal draws: header, body, footer and Close. Modal renders it inside the dialog; on its own it shows a modal in the page, for guidance and documentation, since a real dialog sits over everything, one at a time. It has no focus handling and no role, so it is not a way to build a non-modal dialog.",
      },
    },
  },
  render: (args) => {
    const a = args as typeof args & { onDismiss?: () => void };
    return (
      <ModalPanel
        title={String(a.title)}
        description={a.description}
        size={a.size}
        dismissible={a.dismissible}
        onDismiss={a.onDismiss}
        actions={[{ label: "Cancel", variant: "quiet" }, { label: "Create group" }]}
      >
        <Field label="Group name" />
      </ModalPanel>
    );
  },
};

const ModalRule = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section data-shell="stack" data-gap="3">
    <h2 style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>{title}</h2>
    {children}
  </section>
);

/**
 * When to use a modal, and how to write one.
 *
 * From the ds-corpus modal brief (Carbon, Primer, USWDS, Lightning), in our
 * words. The examples are ModalPanel, the panel Modal draws, shown in place so
 * the guidance stays true when Modal changes.
 */
export const UsingModals: Story = {
  name: "Using modals",
  args: { open: false, onClose: () => {}, title: "Using modals" },
  parameters: {
    docs: {
      description: {
        story:
          "The rules for a modal, each with its reason, as Do and Don't pairs. The examples are ModalPanel, the panel a Modal draws, shown in the page rather than over it. Drawn from the ds-corpus modal brief: USWDS on keeping things in the page and on steps, Carbon on titles and on what a modal is not for, Primer and Lightning on the footer.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ maxInlineSize: "56rem" }}>
      <ModalRule title="Last resort: if it can be in the page, put it in the page">
        <GuidancePair>
          <Guidance tone="do" note="Tell people a thing worked, or didn't, where it happened, with an Alert in the page. They read it and carry on; nothing stands between them and the next thing they meant to do.">
            <Alert status="success" title="Changes saved">Your profile is up to date.</Alert>
          </Guidance>
          <Guidance tone="dont" note="Don't put a success, an error or a notice in a modal. It takes over the screen to say something that needed no answer, and its only button is the one that makes it go away.">
            <ModalPanel size="sm" title="Success!" actions={[{ label: "OK" }]}>
              Your changes were saved.
            </ModalPanel>
          </Guidance>
        </GuidancePair>
      </ModalRule>

      <ModalRule title="The reader opens it">
        <GuidancePair>
          <Guidance tone="do" note="Open a modal because someone pressed something that asked for it. They know where it came from and what it is for, and focus goes back to that button when it closes.">
            <Button variant="outline">Create access group</Button>
          </Guidance>
          <Guidance tone="dont" note="Don't open one on its own: on load, on a timer, on the way out. It interrupts something the reader chose to do with something they didn't. The exceptions are the few that cannot wait, like a session about to end.">
            <ModalPanel size="sm" title="Join our newsletter" actions={[{ label: "No thanks", variant: "quiet" }, { label: "Subscribe" }]}>
              Get the latest news straight to your inbox.
            </ModalPanel>
          </Guidance>
        </GuidancePair>
      </ModalRule>

      <ModalRule title="The title is the button, the buttons say what happens">
        <GuidancePair>
          <Guidance tone="do" note="Title the modal with the words of the button that opened it, and label the action with what it does. A reader who sees only the buttons still knows what they are agreeing to. Cancel first, the action last.">
            <ModalPanel size="sm" title="Delete this project?" description="Its pages and history are deleted for everyone, and cannot be recovered." actions={[{ label: "Keep project", variant: "quiet" }, { label: "Delete project", tone: "danger" }]} />
          </Guidance>
          <Guidance tone="dont" note="Don't ask Are you sure? and answer with Yes and No. The reader has to go back to the question to find out what Yes does, and the one who skims presses it.">
            <ModalPanel size="sm" title="Are you sure?" actions={[{ label: "No", variant: "quiet" }, { label: "Yes" }]} />
          </Guidance>
        </GuidancePair>
      </ModalRule>

      <ModalRule title="One task, one screen">
        <GuidancePair>
          <Guidance tone="do" note="Keep a modal to one short task: a name, a choice, a confirmation. If it needs more than that, it needs a page.">
            <ModalPanel size="sm" title="Create access group" actions={[{ label: "Cancel", variant: "quiet" }, { label: "Create group" }]}>
              <Field label="Group name" />
            </ModalPanel>
          </Guidance>
          <Guidance tone="dont" note="Don't put steps, tabs or accordions in a modal. A wizard in a box has no back button and no address, and closing it by mistake loses every step at once. Use pages.">
            <ModalPanel size="sm" title="Create access group (step 2 of 4)" actions={[{ label: "Back", variant: "quiet" }, { label: "Next" }]}>
              <Field label="Members" />
            </ModalPanel>
          </Guidance>
        </GuidancePair>
      </ModalRule>

      <ModalRule title="Check the answer inside it">
        <GuidancePair>
          <Guidance tone="do" note="When the answer is wrong, keep the modal open and put the message at the field. What was typed is still there to fix.">
            <ModalPanel size="sm" title="Create access group" actions={[{ label: "Cancel", variant: "quiet" }, { label: "Create group" }]}>
              <Field label="Group name" defaultValue="Editors" error="There is already a group called Editors. Enter a different name" />
            </ModalPanel>
          </Guidance>
          <Guidance tone="dont" note="Don't close the modal and report the problem in the page. The reader has to open it again, find their place and type it all over.">
            <Alert status="danger" title="Group not created">A group with that name already exists.</Alert>
          </Guidance>
        </GuidancePair>
      </ModalRule>

      <ModalRule title="Let people leave">
        <GuidancePair>
          <Guidance tone="do" note="Close, Escape and Cancel all leave without changing anything behind the modal. Knowing they can back out is what lets people open it in the first place.">
            <ModalPanel size="sm" title="Rename file" actions={[{ label: "Cancel", variant: "quiet" }, { label: "Rename" }]}>
              <Field label="File name" defaultValue="Quarterly report" />
            </ModalPanel>
          </Guidance>
          <Guidance tone="dont" note="Don't take the way out away (dismissible={false}) to make someone answer a question they could skip. Keep it for the decision that has to be made, like a session about to end, and give it two actions that both close it.">
            <ModalPanel size="sm" dismissible={false} title="Rate your experience" actions={[{ label: "Rate us" }]} />
          </Guidance>
        </GuidancePair>
      </ModalRule>
    </div>
  ),
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
      actions={[{ label: "Button", variant: "outline" }, { label: "Button" }]}
    >
      Body copy for the dialog. It explains the decision being asked for.
    </Modal>
  ),
};

export const OnionSkinDescription: Story = {
  name: "Onion skin: description (Figma)",
  args: { open: false, onClose: () => {}, title: "Modal title" },
  parameters: {
    docs: { description: { story: "A small modal's panel with a description under the title, shown in place, for the Figma ModalDescription component to be laid over." } },
    onion: { component: "ModalDescription", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div style={{ inlineSize: 384 }}>
      <ModalPanel
        size="sm"
        title="Modal title"
        description="One or two sentences under the title that say what is at stake."
        actions={[{ label: "Button", variant: "outline" }, { label: "Button" }]}
      >
        Body copy for the dialog. It explains the decision being asked for.
      </ModalPanel>
    </div>
  ),
};
