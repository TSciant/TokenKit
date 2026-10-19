import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Field } from "./Field";
import { SaveStatus } from "./SaveStatus";

const meta = {
  title: "04 Primitives/91 Save status",
  component: SaveStatus,
  parameters: {
    docs: {
      description: {
        component:
          "Saving feedback is a pattern more than a component; this is the one piece it lacked. Manual save: the Save button says it is working (Button busy, \"Saving…\") and stays enabled; when the change is visible, say nothing more, otherwise a line near the button or a Toast with no actions. Errors on submit: at the fields and in an ErrorSummary. Saving by itself (auto-save): SaveStatus, a quiet line beside the edited content, never a toast: \"Saving…\" then \"Change saved\", and \"3 changes saved\" instead of stacking messages; a draft gets its time (\"Draft saved 1 min ago\"). Save a typed field on blur and 3 seconds after the last key. A failed save is a danger Alert with Retry that stays until it saves. Undo sits beside the change, never in a toast. Leaving with unsaved changes: a Modal, \"Save changes\" and \"Leave without saving\". Never auto-save money, security or privacy settings, or a whole form. From Pajamas and Zendesk Garden.",
      },
    },
  },
  argTypes: { state: { control: "inline-radio", options: ["saving", "saved"] } },
  args: { state: "saved", message: "3 changes saved" },
} satisfies Meta<typeof SaveStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ADraft: Story = {
  name: "A draft",
  args: { state: "saved", message: "Draft saved", time: "1 min ago" },
};

/** Typing auto-saves on a pause; a switch makes the save fail. */
function AutoSave() {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [count, setCount] = useState(0);
  const [failNext, setFailNext] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = () => {
    setState("saving");
    setTimeout(() => { if (failNext) setState("failed"); else { setCount((c) => c + 1); setState("saved"); } }, 700);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div data-shell="stack" data-gap="4" style={{ maxInlineSize: "36rem" }}>
      <Field label="Team description" control="textarea" onChange={() => { clearTimeout(timer.current); timer.current = setTimeout(save, 3000); }} onBlur={save} />
      <div style={{ minBlockSize: "1.5rem" }}>
        {state === "saving" ? <SaveStatus state="saving" /> : state === "saved" ? <SaveStatus state="saved" message={count === 1 ? "Change saved" : `${count} changes saved`} /> : null}
      </div>
      {state === "failed" ? <Alert tone="danger" title="Your change was not saved" action={<Button size="sm" variant="outline" onClick={() => { setFailNext(false); save(); }}>Retry</Button>}>Check your connection and try again.</Alert> : null}
      <label style={{ display: "flex", gap: "var(--tk-space-2)", alignItems: "center" }}><input type="checkbox" checked={failNext} onChange={(e) => setFailNext(e.currentTarget.checked)} /> Make the next save fail</label>
    </div>
  );
}

export const AutoSaving: Story = {
  name: "Auto-saving a field",
  parameters: { docs: { description: { story: "Type, then pause for 3 seconds or leave the field: \"Saving…\", then \"Change saved\", then a running count. A failed save is an Alert with Retry that stays." } } },
  render: () => <AutoSave />,
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma SaveStatus laid over this one: \"3 changes saved\" with its tick." } },
    onion: { component: "SaveStatus", skin: () => "default.png" },
  },
};
