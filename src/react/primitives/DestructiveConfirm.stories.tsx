import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { DestructiveConfirm } from "./DestructiveConfirm";

const meta = {
  title: "04 Primitives/84 Destructive confirm",
  component: DestructiveConfirm,
  parameters: {
    docs: {
      description: {
        component:
          "A pause before an action that cannot be undone, sized to how much it destroys. Low (a message, a draft): no dialog at all; do it and offer Undo in a Toast that stays until dismissed. Medium (one thing): this dialog with a button. High (it takes other things with it, or cannot be put back): the person types the thing's name before the action becomes available. An alert dialog: the title is a question in the action's words (\"Delete project?\", never \"Are you sure?\"), the consequence names the thing and is read when it opens, Cancel comes first and takes focus (for high, the name field does), and the action is the danger button saying what it does. A click outside does nothing; Escape and Cancel leave everything as it was. While the action runs the dialog stays open and busy; if it fails, the reason shows here and nothing closes. Afterwards go back to the list and confirm in a Toast; when the thing is gone, give returnFocusTo somewhere to go. No Alert inside it, and never a dialog from a dialog. Where more than a name is needed (a reason, a summary), use a page. From Pajamas, Paste, Carbon, MOJ, Astryx, Gestalt and the W3C APG alert dialog.",
      },
    },
  },
  argTypes: { severity: { control: "inline-radio", options: ["medium", "high"] } },
  args: {
    open: false,
    onClose: () => {},
    onConfirm: () => {},
    title: "Delete API key?",
    consequence: "You're deleting the key ci-runner. Builds that use it stop working at once. You cannot undo this action.",
    confirmLabel: "Delete key",
  },
} satisfies Meta<typeof DestructiveConfirm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opens from a button; the action takes a moment, as a real one would. */
function Demo(props: Partial<Parameters<typeof DestructiveConfirm>[0]> & { trigger: string; fail?: boolean }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const { trigger, fail, ...rest } = props;
  return (
    <div data-shell="stack" data-gap="3">
      <div><Button tone="danger" variant="outline" onClick={() => { setDone(false); setOpen(true); }}>{trigger}</Button></div>
      {done ? <p style={{ margin: 0 }}>Done. In a service this goes back to the list and says so in a Toast.</p> : null}
      <DestructiveConfirm
        title="Delete API key?"
        consequence="You're deleting the key ci-runner. Builds that use it stop working at once. You cannot undo this action."
        confirmLabel="Delete key"
        {...rest}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => new Promise<void>((resolve, reject) => setTimeout(() => (fail ? reject(new Error("The key could not be deleted. Try again in a few minutes.")) : (setDone(true), resolve())), 1200))}
      />
    </div>
  );
}

export const Medium: Story = {
  name: "Medium: one thing",
  parameters: { docs: { description: { story: "Cancel is first and takes focus; the action is the danger button in the title's words. The dialog stays open, busy, while the key is deleted." } } },
  render: () => <Demo trigger="Delete key" />,
};

export const High: Story = {
  name: "High: type its name",
  parameters: { docs: { description: { story: "The project takes its pipelines and releases with it, so its name is typed first; focus starts in the field, and the action says why it is unavailable until the name matches." } } },
  render: () => (
    <Demo
      trigger="Delete project"
      severity="high"
      title="Delete project?"
      consequence="When you delete acme-web, all its pipelines, packs and 1,204 releases are permanently deleted. You cannot undo this action."
      confirmLabel="Delete project"
      confirmText="acme-web"
    />
  ),
};

export const WhenItFails: Story = {
  name: "When it fails",
  parameters: { docs: { description: { story: "The action fails: the reason shows in the dialog, nothing closes, and it can be tried again or cancelled." } } },
  render: () => <Demo trigger="Delete key" fail />,
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: {
    open: true,
    severity: "high",
    title: "Delete project?",
    consequence: "When you delete acme-web, all its pipelines, packs and 1,204 releases are permanently deleted. You cannot undo this action.",
    confirmLabel: "Delete project",
    confirmText: "acme-web",
  },
  parameters: {
    docs: { description: { story: "The Figma DestructiveConfirm laid over this one: the high tier, open, before the name is typed. Drawn inside the dialog, as Modal's is." } },
    onion: { component: "DestructiveConfirm", skin: () => "default.png" },
  },
};
