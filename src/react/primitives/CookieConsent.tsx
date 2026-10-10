"use client";
/* Client component: it remembers the choice for its confirmation line, moves
   focus to that line, and measures itself to leave the page room. */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Button } from "./Button";

export type CookieConsentChoice = "accepted" | "rejected";

export interface CookieConsentProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * The heading: what this is about, in a few words. Name the site when it
   * helps ("Cookies on Example Store"). It names the region too, and it stays
   * through the confirmation, so the region keeps its name after a choice.
   */
  title?: ReactNode;
  /** The heading's level in the page outline. Default 2. */
  level?: 2 | 3;
  /**
   * The message: which cookies are essential, which are not, and what the
   * non-essential ones are for. Two short sentences; the policy has the rest.
   */
  children?: ReactNode;
  /** Where the cookie policy is. Without it there is no policy link. */
  policyHref?: string;
  /** The policy link's words. Default "Read the cookie policy". */
  policyLabel?: string;
  /**
   * Where the cookie settings are, when they are a page of their own. With
   * it, "Cookie settings" is a link that works without script, and the
   * confirmation offers a way back to it. Without it, it is a button that
   * calls `onSettings`.
   */
  settingsHref?: string;
  /** The accept button's words. Default "Accept all". */
  acceptLabel?: string;
  /** The reject button's words. Default "Reject non-essential". */
  rejectLabel?: string;
  /** The settings action's words. Default "Cookie settings". */
  settingsLabel?: string;
  /** The words on the button that hides the confirmation. Default "Hide this message". */
  hideLabel?: string;
  /**
   * Called when they accept. Set the cookies and record the choice here:
   * the banner stores nothing itself. Unmount it here to skip the
   * confirmation.
   */
  onAccept?: () => void;
  /** Called when they reject non-essential cookies. As `onAccept`, the host records it. */
  onReject?: () => void;
  /** Called by the settings button (not when `settingsHref` makes it a link): open the settings. */
  onSettings?: () => void;
  /** Called when the confirmation is hidden, after the banner has gone. */
  onHide?: () => void;
  /**
   * The choice, when the host already knows it: shows the confirmation
   * instead of the question. Left out, the banner keeps track of the choice
   * made in it, until it is hidden.
   */
  choice?: CookieConsentChoice;
  /** The line after accepting. Default: "You've accepted all cookies." plus the way back to the settings. */
  acceptedMessage?: ReactNode;
  /** The line after rejecting. Default: "You've rejected non-essential cookies." plus the way back to the settings. */
  rejectedMessage?: ReactNode;
  /**
   * Which edge of the viewport it is fixed to. Default bottom. Ignored when
   * `contained`.
   */
  position?: "bottom" | "top";
  /**
   * In the flow of the page instead of fixed to the viewport: for docs,
   * stories, and a settings page that shows the banner in place.
   */
  contained?: boolean;
}

/**
 * CookieConsent — the banner that asks whether non-essential cookies may be
 * set, before any are.
 *
 * A region named by its heading, with the message, a link to the cookie
 * policy and three actions: Accept all, Reject non-essential, and Cookie
 * settings. Accept and reject are the same variant and the same size, side by
 * side, because they are equal answers to one question: a banner that makes
 * yes a button and no a grey link is deciding for the reader, and in much of
 * the world that is not consent. Settings is quieter; it is a third way in,
 * not a third answer.
 *
 * It never decides and never stores. Nothing is set until a button is
 * pressed, and the choice goes to the host through `onAccept` or `onReject`
 * to record however it records things. After a choice the question gives way
 * to one line saying what was chosen and a Hide button, as GOV.UK's banner
 * does, and focus moves to that line, so a keyboard or screen reader user
 * hears the answer instead of losing their place when the buttons go. A host
 * that would rather not confirm unmounts the banner in the callback.
 *
 * Fixed to the bottom of the viewport by default, or the top. While it is
 * fixed it grows the page's scroll padding by its own height, so a link
 * tabbed to or jumped to is scrolled clear of it rather than under it (WCAG
 * 2.4.11), and it keeps clear of a phone's home indicator and notch. Render it
 * first in the body, so it is the first thing a keyboard or screen reader
 * reaches. `contained` puts it in the flow instead, for docs and stories.
 */
export function CookieConsent({
  title = "Cookies on this site",
  level = 2,
  children = "We use some essential cookies to make this site work. We'd also like to set analytics cookies to understand how it is used. We won't set them unless you say yes.",
  policyHref,
  policyLabel = "Read the cookie policy",
  settingsHref,
  acceptLabel = "Accept all",
  rejectLabel = "Reject non-essential",
  settingsLabel = "Cookie settings",
  hideLabel = "Hide this message",
  onAccept,
  onReject,
  onSettings,
  onHide,
  choice,
  acceptedMessage,
  rejectedMessage,
  position = "bottom",
  contained = false,
  ...rest
}: CookieConsentProps) {
  const [made, setMade] = useState<CookieConsentChoice | null>(null);
  const [hidden, setHidden] = useState(false);
  const shown = choice ?? made;

  const titleId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const confirmRef = useRef<HTMLParagraphElement>(null);
  /* Focus moves only after a choice made here, never because the host passed
     `choice` on first render: a page does not get to move focus on load. */
  const focusNext = useRef(false);

  const choose = (next: CookieConsentChoice) => {
    focusNext.current = true;
    setMade(next);
    (next === "accepted" ? onAccept : onReject)?.();
  };

  useEffect(() => {
    if (shown && focusNext.current) {
      focusNext.current = false;
      confirmRef.current?.focus();
    }
  }, [shown]);

  /* Room for itself. A fixed banner covers the page's edge, and a link tabbed
     to there would be scrolled under it. Scroll padding on the root is the
     page's own answer to that (WCAG technique C43): it is added to whatever
     the page already has, a sticky header's padding at the top for instance,
     and put back exactly as it was when the banner goes. */
  useEffect(() => {
    const el = rootRef.current;
    if (contained || hidden || !el || typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    const prop = position === "top" ? "scroll-padding-block-start" : "scroll-padding-block-end";
    const before = root.style.getPropertyValue(prop);
    root.style.removeProperty(prop);
    const computed = getComputedStyle(root).getPropertyValue(prop).trim();
    const base = computed && computed !== "auto" ? computed : "0px";
    const apply = () => root.style.setProperty(prop, `calc(${base} + ${el.offsetHeight}px)`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (before) root.style.setProperty(prop, before);
      else root.style.removeProperty(prop);
    };
  }, [contained, hidden, position]);

  if (hidden) return null;

  const Heading = `h${level}` as const;
  const settingsBack = settingsHref ? (
    <>
      {" "}
      You can <a href={settingsHref}>change your cookie settings</a> at any time.
    </>
  ) : null;
  const confirmation =
    shown === "accepted"
      ? (acceptedMessage ?? <>You’ve accepted all cookies.{settingsBack}</>)
      : (rejectedMessage ?? <>You’ve rejected non-essential cookies.{settingsBack}</>);

  return (
    <section
      {...rest}
      ref={rootRef}
      data-tk="cookie-consent"
      data-position={position === "top" ? "top" : undefined}
      data-contained={contained ? "" : undefined}
      aria-labelledby={rest["aria-label"] ? undefined : titleId}
    >
      <div data-tk="cookie-consent-inner">
        <Heading id={titleId} data-tk="cookie-consent-title" data-text="heading-s">
          {title}
        </Heading>
        {shown ? (
          <>
            <p data-tk="cookie-consent-confirmation" ref={confirmRef} tabIndex={-1}>
              {confirmation}
            </p>
            <div data-tk="cookie-consent-actions">
              <Button
                variant="outline"
                onClick={() => {
                  setHidden(true);
                  onHide?.();
                }}
              >
                {hideLabel}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div data-tk="cookie-consent-message">{children}</div>
            {policyHref ? (
              <p data-tk="cookie-consent-policy">
                <a href={policyHref}>{policyLabel}</a>
              </p>
            ) : null}
            {/* Accept and reject: one variant, one size, in that order, every
                time. Equal answers look equal. */}
            <div data-tk="cookie-consent-actions">
              <Button variant="solid" onClick={() => choose("accepted")}>
                {acceptLabel}
              </Button>
              <Button variant="solid" onClick={() => choose("rejected")}>
                {rejectLabel}
              </Button>
              {settingsHref ? (
                <Button variant="quiet" href={settingsHref}>
                  {settingsLabel}
                </Button>
              ) : (
                <Button variant="quiet" onClick={onSettings}>
                  {settingsLabel}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
