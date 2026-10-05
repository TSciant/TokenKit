import type { HTMLAttributes, ReactNode } from "react";
import { Button, type ButtonProps } from "./Button";
import { MenuButton } from "./MenuButton";

export type ButtonGroupAction = {
  label: string;
  /** A link. Without one the action is a button and calls `onSelect`. */
  href?: string;
  onSelect?: () => void;
  variant?: ButtonProps["variant"];
  tone?: ButtonProps["tone"];
  disabled?: boolean;
  /** Why it is disabled; see Button. */
  reason?: ReactNode;
};

export type ButtonGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  /** The actions, in reading order. The first `max` show as buttons. */
  actions: ButtonGroupAction[];
  /** The group's accessible name ("Form actions", "Card actions"). */
  label: string;
  /** Which edge the buttons sit against. */
  // tk-vocab: align omits center, stretch — a group of actions sits against one edge; those values belong to the shells' data-align
  align?: "start" | "end";
  /**
   * How many controls show before the rest move behind a More button. Three
   * at most: past that a row of buttons stops being a choice and becomes a
   * toolbar to read.
   */
  max?: 2 | 3;
  /** Every button as wide as the widest label, so a row reads as a set. */
  equal?: boolean;
  size?: ButtonProps["size"];
  /** The overflow trigger's label. */
  moreLabel?: string;
};

/**
 * Button group — two or three related actions, and the rule for the rest.
 *
 * The decisions are Carbon's, which the ds-corpus Button brief found to be the
 * only system that writes them down: groups of two or three; past that a
 * menu, not a fourth button; one weight of emphasis each (one solid, the
 * others outline or quiet); every button the same width when they are a set.
 * Order is reading order, in the DOM and on screen, at every width: the group
 * wraps to a full-width stack in a narrow box without reversing anything, so
 * focus order and reading order never disagree (WCAG 1.3.2, 2.4.3). That
 * means a group aligned to the end is written "Cancel, Save", and stacks with
 * Cancel on top. Destructive actions should not be the ones that overflow:
 * a menu item cannot carry a tone. The More trigger takes the group's size,
 * so it sits level with the buttons beside it.
 */
export function ButtonGroup({
  actions,
  label,
  align = "start",
  max = 3,
  equal,
  size,
  moreLabel = "More",
  ...rest
}: ButtonGroupProps) {
  const overflow = actions.length > max;
  const shown = overflow ? actions.slice(0, max - 1) : actions;
  const hidden = overflow ? actions.slice(max - 1) : [];

  return (
    <div
      data-tk="button-group"
      role="group"
      aria-label={label}
      data-align={align === "end" ? "end" : undefined}
      data-equal={equal ? "" : undefined}
      {...rest}
    >
      <div data-tk="button-group-row">
      {shown.map((a) => (
        <Button
          key={a.label}
          href={a.href}
          onClick={a.onSelect}
          variant={a.variant}
          tone={a.tone}
          size={size}
          disabled={a.disabled}
          reason={a.reason}
        >
          {a.label}
        </Button>
      ))}
      {overflow ? (
        <MenuButton
          label={moreLabel}
          variant="quiet"
          size={size ?? "md"}
          align={align}
          items={hidden.map((a) => ({ label: a.label, href: a.href, onSelect: a.onSelect }))}
        />
      ) : null}
      </div>
    </div>
  );
}
