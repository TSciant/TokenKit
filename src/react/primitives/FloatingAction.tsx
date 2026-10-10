import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEventHandler } from "react";
import { Icon, type IconName } from "./Icon";

type Shared = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type" | "onClick"
>;

export interface FloatingActionProps extends Shared {
  /**
   * What it does, in a few words: "Start a chat", "New message", "Ready to
   * talk?". Always the accessible name, whether or not it is showing, so say
   * the action rather than describing the icon.
   */
  label: string;
  /**
   * A kit icon for the action. The round button needs one: without it the
   * label shows, as if `extended` were set. The tab shows it above its
   * label, and needs it to become a round button on a narrow screen.
   */
  icon?: IconName;
  /** Where it goes. With it, it is a link, and works without script. */
  href?: string;
  /** What it does, when it is a button rather than a link. */
  onClick?: MouseEventHandler<HTMLElement>;
  /**
   * "button" (the default) is a round button in the corner, the label beside
   * the icon when `extended`. "tab" is a tab on the page's edge with its
   * label set vertically, for an invitation that should be there but out of
   * the way ("Ready to talk?"). On a narrow screen a tab becomes the round
   * button: a tab across a phone's edge covers the text it sits beside.
   */
  variant?: "button" | "tab";
  /** Shows the label beside the icon on the round button. Wider, plainer, easier to hit. */
  extended?: boolean;
  /**
   * Which side: "end" (the default) is the inline end, the right in a
   * left-to-right page; "start" is the other side. The button sits at the
   * bottom of that side, the tab halfway up it.
   */
  position?: "end" | "start";
  /**
   * Positions it inside its nearest positioned ancestor instead of the
   * viewport: for docs, stories, and a panel that has its own action.
   */
  contained?: boolean;
}

/**
 * FloatingAction — one primary action that floats over the page: a round
 * button in the corner, or a tab on the page's edge.
 *
 * For the one thing a reader should be able to do from anywhere on the page:
 * start a chat, write a new message, get in touch. One per page, because a
 * second is no longer the primary action, and never for something that
 * belongs to one section (put that in the section). Material calls the round
 * one a floating action button and the labelled one an extended FAB.
 *
 * The label is always the accessible name. On the round button it is
 * visually hidden unless `extended`; on the tab it is set vertically along
 * the edge. Either way it is in the markup, so the name a screen reader hears
 * and the words a voice-control user says are the same ones.
 *
 * It covers what is under it, so it keeps out of the way where it can: it
 * clears a phone's notch and home indicator (the safe-area insets), it adds
 * its own height to the page's scroll padding so a link tabbed to near the
 * bottom is scrolled clear of it, and on a narrow screen the tab turns into
 * the round button. Leave room at the end of the page for it, since the last
 * lines are the ones that cannot scroll out from under it. Its colour changes
 * on hover and focus; nothing about it moves.
 */
export function FloatingAction({
  label,
  icon,
  href,
  onClick,
  variant = "button",
  extended = false,
  position = "end",
  contained = false,
  ...rest
}: FloatingActionProps) {
  const attrs = {
    ...rest,
    "data-tk": "floating-action",
    "data-variant": variant === "tab" ? "tab" : undefined,
    "data-position": position === "start" ? "start" : undefined,
    /* The label shows when asked, and whenever there is no icon to show. */
    "data-extended": extended || !icon ? "" : undefined,
    "data-contained": contained ? "" : undefined,
    onClick,
  };

  const content = (
    <>
      {icon ? <Icon name={icon} size="lg" /> : null}
      <span data-tk="floating-action-label">{label}</span>
    </>
  );

  return href != null ? (
    <a {...(attrs as AnchorHTMLAttributes<HTMLAnchorElement>)} href={href}>
      {content}
    </a>
  ) : (
    <button {...(attrs as ButtonHTMLAttributes<HTMLButtonElement>)} type="button">
      {content}
    </button>
  );
}
