import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import { Icon } from "./Icon";
import { STATUS_ICON } from "./status-icon";

type ChipBase = {
  emphasis?: "default" | "strong" | "quiet";
  /**
   * A status: info, success, warning, danger, on the pack's status colours.
   * Always a word ("Closed", "Overdue"), with an icon where it helps, since
   * colour alone means nothing to some readers; and never a control (a
   * status is read, not pressed). Neutral renders no attribute.
   */
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  /** Makes the chip a control (24px target). Prefer with pressed for filters. */
  interactive?: boolean;
  /** Toggle / filter selected state. Progressive: absent = plain label. */
  pressed?: boolean;
  /** Leading mark — prefer a small Icon. */
  leading?: ReactNode;
  /** A toned chip shows its status icon before the word (default true); false to drop it, or give your own with leading. */
  statusIcon?: boolean;
  children?: ReactNode;
};

export type ChipProps = ChipBase &
  (
    | ({ interactive: true } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ interactive?: false | undefined } & HTMLAttributes<HTMLSpanElement>)
  );

/**
 * Chip. Baseline is a non-interactive label. Progressive layers:
 * interactive → real button; pressed → aria-pressed; leading → icon/mark.
 */
export function Chip({
  emphasis,
  tone,
  interactive,
  pressed,
  leading,
  statusIcon = true,
  children,
  ...rest
}: ChipProps) {
  /* A status is never colour alone: a toned chip carries its icon too, unless told not to. */
  const mark = leading ?? (statusIcon && tone && tone !== "neutral" ? <Icon name={STATUS_ICON[tone]} size="sm" /> : null);
  const common = {
    "data-tk": "chip",
    "data-emphasis": emphasis === "default" ? undefined : emphasis,
    "data-tone": tone === "neutral" ? undefined : tone,
    "data-interactive": interactive ? "" : undefined,
    "data-pressed": pressed ? "" : undefined,
    "data-leading": mark ? "" : undefined,
  } as const;

  const body = (
    <>
      {mark ? <span data-tk="chip-leading">{mark}</span> : null}
      <span data-tk="chip-label">{children}</span>
    </>
  );

  if (interactive) {
    const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        type="button"
        {...common}
        aria-pressed={pressed ?? false}
        {...buttonRest}
      >
        {body}
      </button>
    );
  }

  return (
    <span {...common} {...(rest as HTMLAttributes<HTMLSpanElement>)}>
      {body}
    </span>
  );
}
