import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";
import { Spinner } from "./Loading";
import { STATUS_ICON } from "./status-icon";

export interface SaveStatusProps extends HTMLAttributes<HTMLSpanElement> {
  state: "saving" | "saved";
  /** In place of "Saving…" / "Saved": "3 changes saved", "Draft saved". */
  message?: ReactNode;
  /** When, shown after the words but not read out each time it changes: "1 min ago". */
  time?: ReactNode;
}

/**
 * SaveStatus — "Saving…", then "Saved", beside what was changed.
 *
 * For saving that happens by itself (as you type, or on each change): a
 * quiet line next to the edited content, not a toast, that says one thing
 * and then the next instead of stacking ("3 changes saved"). A polite status
 * region, so a screen reader hears each state once; the time sits outside
 * it. A failed save is not this: a danger Alert with Retry that stays until
 * it saves. A manual Save button says it is working itself (Button busy).
 */
export function SaveStatus({ state, message, time, ...rest }: SaveStatusProps) {
  return (
    <span {...rest} data-tk="save-status" data-state={state}>
      <span data-tk="save-status-words" role="status">
        {state === "saving" ? <Spinner decorative delay={0} /> : <Icon name={STATUS_ICON.success} size="sm" />}
        {message ?? (state === "saving" ? "Saving…" : "Saved")}
      </span>
      {time ? <span data-tk="save-status-time">{time}</span> : null}
    </span>
  );
}
