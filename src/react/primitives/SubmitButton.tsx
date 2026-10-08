"use client";
/* Client component: it reads its form's status. */

import * as ReactDOM from "react-dom";
import { Button, type ButtonProps } from "./Button";

export type SubmitButtonProps = Omit<ButtonProps, "type" | "busy" | "as" | "href"> & {
  /** The words while the form is submitting: "Posting…", "Saving…". */
  busyLabel: ButtonProps["busyLabel"];
  /** Busy regardless of the form, for a submit the page tracks itself. */
  busy?: boolean;
};

/* useFormStatus is React 19's; on 18 the button still works and is simply
   never busy on its own. */
const useFormStatus: () => { pending: boolean } =
  (ReactDOM as unknown as { useFormStatus?: () => { pending: boolean } }).useFormStatus ?? (() => ({ pending: false }));

/**
 * SubmitButton — a form's submit button that shows it is working.
 *
 * While its form is submitting it is busy: the label changes to `busyLabel`
 * and that change is announced, a second press does nothing, and it keeps
 * its place in the tab order so focus stays on it. Without JavaScript it is
 * an ordinary submit button. Guard against a double submission on the
 * server too: a button cannot stop one that is already on its way.
 */
export function SubmitButton({ busy, busyLabel, children, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button {...rest} type="submit" busy={busy || pending} busyLabel={busyLabel}>
      {children}
    </Button>
  );
}
