import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Guidance, GuidancePair } from "./Guidance";
import { ModalPanel } from "./Modal";

const meta = {
  title: "04 Primitives/08 Alert",
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          "Status is carried by the boundary and the label, never by colour alone — 1.4.1 forbids that in any pack, so a grayscale pack having no hue to spend costs nothing. A brand pack fills the same status slots with hue and this component does not change. Use for: Inline status after an action, form errors, or system notices on the page. Don't use for: Marketing banners, permanent page intros, or modal confirmations (use Modal).",
      },
    },
  },
  argTypes: {
    status: { control: "inline-radio", options: ["info", "success", "warning", "danger"] },
    live: { control: "boolean" },
    action: { control: false },
  },
  args: { title: "Info", children: "Something worth reading." },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A success with Undo at 480px, for the Figma alert with an action to be laid over. */
export const OnionSkinAction: Story = {
  name: "Onion skin: with an action (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Alert with an action laid over this one: a success message with Undo at 480px." } },
    onion: { component: "AlertAction", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div style={{ inlineSize: 480 }}>
      <Alert status="success" title="That conversation has been removed." action={<Button variant="outline" size="sm">Undo</Button>} />
    </div>
  ),
};

/** Done, with Undo beside it: the kit's answer to "Are you sure?" for anything that can be put back. */
export const Undo: Story = {
  name: "Undo, not confirm",
  parameters: {
    docs: {
      description: {
        story:
          "For an action that can be put back, do it and say so, with Undo beside the message, rather than asking first. A question before every removal is a question people learn to click through; an Undo is there for the one time it matters. Keep the confirming Modal for what cannot be undone. Inline at the top of the content, never timed out: it goes when the page moves on. Drawn from a members' message board built on the kit, Material's snackbar and Primer's case against toasts.",
      },
    },
  },
  render: () => {
    function Demo() {
      const [removed, setRemoved] = useState(true);
      return (
        <div data-shell="stack" data-gap="6" style={{ maxInlineSize: "48rem" }}>
          {removed ? (
            <Alert status="success" live title="That conversation has been removed." action={<Button variant="outline" size="sm" onClick={() => setRemoved(false)}>Undo</Button>}>
              It is gone from the board for everyone.
            </Alert>
          ) : (
            <Alert status="info" live title="It’s back where it was." />
          )}
          <GuidancePair>
            <Guidance tone="do" note="Do it, say it's done, and offer Undo beside the message. One press puts it back.">
              <Alert status="success" title="That conversation has been removed." action={<Button variant="outline" size="sm">Undo</Button>} />
            </Guidance>
            <Guidance tone="dont" note="Don't ask first for something that can be put back. A question before every removal teaches people to say yes without reading it.">
              <ModalPanel title="Remove it?" size="sm" actions={[{ label: "Cancel", variant: "outline" }, { label: "Remove", variant: "solid", tone: "danger" }]} />
            </Guidance>
          </GuidancePair>
        </div>
      );
    }
    return <Demo />;
  },
};

export const AllStatuses: Story = {
  name: "All statuses",
  render: () => (
    <div data-shell="stack" data-gap="3">
      <Alert title="Info">Neutral message.</Alert>
      <Alert status="success" title="Success">Completed.</Alert>
      <Alert status="warning" title="Warning">Worth checking.</Alert>
      <Alert status="danger" title="Danger">This one carries role="alert".</Alert>
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { title: "Alert title", children: "What happened, and what to do about it." },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 400px width the design was drawn at. Switch Onion in the toolbar; status picks the skin." } },
    onion: { component: "Alert", skin: (a: Record<string, unknown>) => `${(a.status as string) ?? "info"}.png` },
  },
  decorators: [(Story) => <div style={{ inlineSize: 400 }}><Story /></div>],
};
