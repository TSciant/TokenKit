import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastItem = {
  /** Stable key: what `onDismiss` is called with. */
  id: string;
  tone?: ToastTone;
  /** One short line: what happened. */
  title: string;
  /** A sentence more, when the title needs it. */
  message?: ReactNode;
  /** One action (a Button or a link). A toast with an action never leaves by itself. */
  action?: ReactNode;
  /**
   * Leave by itself after this many milliseconds (at least 6000). Paused while
   * a pointer is over it or focus is in it. Ignored for warning and danger,
   * and for a toast with an action: those wait to be dismissed.
   */
  timeout?: number;
};

export interface ToastRegionProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  toasts: ToastItem[];
  /** Called when a toast is dismissed, by its button or by its timeout. */
  onDismiss: (id: string) => void;
  /** Names the region for assistive technology. */
  label?: string;
  /** Where the stack sits: fixed to the end of the viewport (default), its start, or in the page's flow. */
  placement?: "block-end" | "block-start" | "static";
  /** The dismiss button's words, before the toast's title ("Dismiss: Saved"). */
  dismissLabel?: string;
}

const ICON: Record<ToastTone, IconName> = { info: "info", success: "success", warning: "warning", danger: "error" };
const MIN = 6000;

function Toast({ toast, onDismiss, dismissLabel }: { toast: ToastItem; onDismiss: (id: string) => void; dismissLabel: string }) {
  const tone = toast.tone ?? "info";
  const lasting = tone === "warning" || tone === "danger" || Boolean(toast.action);
  const ms = toast.timeout && !lasting ? Math.max(MIN, toast.timeout) : 0;
  const [paused, setPaused] = useState(false);
  const left = useRef(ms);
  useEffect(() => {
    if (!ms || paused) return;
    const started = Date.now();
    const t = setTimeout(() => onDismiss(toast.id), left.current);
    return () => {
      clearTimeout(t);
      left.current -= Date.now() - started;
    };
  }, [ms, paused, onDismiss, toast.id]);
  return (
    <li
      data-tk="toast"
      data-status={tone === "info" ? undefined : tone}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <Icon name={ICON[tone]} />
      <div data-tk="toast-text">
        <p data-tk="toast-title">{toast.title}</p>
        {toast.message ? <div data-tk="toast-message">{toast.message}</div> : null}
      </div>
      {toast.action ? <div data-tk="toast-action">{toast.action}</div> : null}
      <button data-tk="toast-dismiss" type="button" onClick={() => onDismiss(toast.id)}>
        <Icon name="close" />
        <span data-tk="visually-hidden">
          {dismissLabel}: {toast.title}
        </span>
      </button>
    </li>
  );
}

/**
 * Toast — a short message about something that just happened, that steps
 * aside on its own or when dismissed.
 *
 * Use for: the result of an action the reader just took ("Saved", "Invite
 * sent"), where the page itself does not show it. Don't use for: anything a
 * reader must act on or must not miss (an Alert, in the page), errors in a
 * form (next to the field and in an error summary), or a message that
 * explains a whole page (a Phase banner or an Alert).
 *
 * A polite live region that is always in the page, so a toast added to it is
 * read out without moving focus. Leaving by itself is opt-in, never under six
 * seconds, paused while a pointer or focus is on it, and never for a warning,
 * a danger or a toast with an action, which wait for the reader (WCAG 2.2.1).
 * Each has a dismiss button that says which message it closes.
 */
export function ToastRegion({ toasts, onDismiss, label = "Notifications", placement = "block-end", dismissLabel = "Dismiss", ...rest }: ToastRegionProps) {
  return (
    <section data-tk="toast-region" data-placement={placement} aria-label={label} {...rest}>
      <ol data-tk="toast-list" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={onDismiss} dismissLabel={dismissLabel} />
        ))}
      </ol>
    </section>
  );
}
