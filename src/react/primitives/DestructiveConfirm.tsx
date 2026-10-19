"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useState, type ReactNode } from "react";
import { Field } from "./Field";
import { Modal, type ModalSize } from "./Modal";

export interface DestructiveConfirmProps {
  open: boolean;
  onClose: () => void;
  /** A question with the action's words: "Delete project?". Never "Are you sure?". */
  title: string;
  /** What will happen, naming the thing: "You're deleting acme-web. You cannot undo this action." Read when it opens. */
  consequence: ReactNode;
  /** The action in the title's words: "Delete project", never "OK". */
  confirmLabel: string;
  /** "Cancel", or "Keep [thing]" when the action is itself a cancellation. */
  cancelLabel?: string;
  /**
   * medium: confirm with a button. high (it takes other things with it, or
   * cannot be put back): type the thing's name first. Low needs no dialog: do
   * it, and offer Undo in a Toast.
   */
  severity?: "medium" | "high";
  /** The name to type, for high. */
  confirmText?: string;
  /** The label of the field for high. Defaults to "Enter [name] to confirm". */
  confirmPrompt?: string;
  /** The action. The dialog stays open and busy until it settles, and shows the error if it fails. */
  onConfirm: () => void | Promise<void>;
  busyLabel?: string;
  /** Where focus goes on close when the thing (and the button that opened this) is gone. */
  returnFocusTo?: () => HTMLElement | null;
  size?: ModalSize;
}

/**
 * DestructiveConfirm — a pause before an action that cannot be undone.
 *
 * An alert dialog: the title is a question, the consequence is read with it,
 * Cancel comes first and takes focus, the action is the danger button in the
 * title's words. A click outside does nothing; Escape and Cancel keep things
 * as they were. For high severity the action stays unavailable until the
 * thing's name is typed, and focus starts in that field. While the action
 * runs the dialog stays open and says so; if it fails, the reason is shown
 * here and nothing closes. Afterwards, go back to the list and confirm in a
 * Toast. No Alert inside, and never a dialog from a dialog.
 */
export function DestructiveConfirm({
  open,
  onClose,
  title,
  consequence,
  confirmLabel,
  cancelLabel = "Cancel",
  severity = "medium",
  confirmText,
  confirmPrompt,
  onConfirm,
  busyLabel = "Deleting…",
  returnFocusTo,
  size = "sm",
}: DestructiveConfirmProps) {
  const fieldId = useId();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => { if (open) { setTyped(""); setBusy(false); setFailed(null); } }, [open]);

  const high = severity === "high" && Boolean(confirmText);
  const matches = !high || typed.trim() === confirmText;

  const run = async () => {
    if (!matches || busy) return;
    setBusy(true);
    setFailed(null);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch (e) {
      setBusy(false);
      setFailed(e instanceof Error && e.message ? e.message : "That did not work. Try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title={title}
      description={consequence}
      alert
      size={size}
      returnFocusTo={returnFocusTo}
      data-severity={severity}
      actions={[
        { label: cancelLabel, variant: "outline", onSelect: onClose, disabled: busy },
        { label: confirmLabel, tone: "danger", onSelect: run, disabled: !matches, reason: !matches ? `Enter ${confirmText} first` : undefined, busy, busyLabel },
      ]}
    >
      {high ? (
        <Field
          id={fieldId}
          label={confirmPrompt ?? `Enter ${confirmText} to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.currentTarget.value)}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
        />
      ) : null}
      {failed ? <p data-tk="field-error" role="alert">{failed}</p> : null}
    </Modal>
  );
}
