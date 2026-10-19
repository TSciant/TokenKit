"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Modal } from "./Modal";

/** "2 minutes" while there is a minute or more, then "45 seconds". */
export function timeLeft(seconds: number) {
  if (seconds >= 60) { const m = Math.ceil(seconds / 60); return `${m} minute${m === 1 ? "" : "s"}`; }
  const s = Math.max(0, Math.ceil(seconds));
  return `${s} second${s === 1 ? "" : "s"}`;
}

type Words = { title: string; message: (left: string) => string; extendLabel: string; signOutLabel: string };
const WORDS: Record<"signed-in" | "anonymous", Words> = {
  "signed-in": { title: "You're about to be signed out", message: (t) => `For your security, we will sign you out in ${t}.`, extendLabel: "Stay signed in", signOutLabel: "Sign out" },
  anonymous: { title: "You're about to lose your answers", message: (t) => `We will delete your answers in ${t}.`, extendLabel: "Continue with your application", signOutLabel: "Delete your answers" },
};

export interface SessionTimeoutWarningProps {
  open: boolean;
  /** Seconds left. */
  remaining: number;
  variant?: "signed-in" | "anonymous";
  title?: string;
  /** In place of the variant's sentence; gets the time left in words. */
  message?: (left: string) => string;
  extendLabel?: string;
  signOutLabel?: string;
  signOutHref: string;
  /** What happens to what they entered: "We will save your answers." */
  answers?: ReactNode;
  onExtend: () => void;
  busy?: boolean;
  /** Words for the status region inside the dialog (the page outside it is inert while it is open). */
  announcement?: string;
}

/**
 * SessionTimeoutWarning — the dialog on its own, with the time left given:
 * the title, the sentence with the time in words (seconds only in the last
 * minute), what happens to their answers, the button to stay (it takes
 * focus) and the way out as a link. Escape and Close mean stay. Use
 * SessionTimeout for the timing; this is its face.
 */
export function SessionTimeoutWarning({ open, remaining, variant = "signed-in", title, message, extendLabel, signOutLabel, signOutHref, answers, onExtend, busy, announcement }: SessionTimeoutWarningProps) {
  const w = WORDS[variant];
  return (
    <Modal
      open={open}
      onClose={onExtend}
      title={title ?? w.title}
      description={(message ?? w.message)(timeLeft(remaining))}
      size="sm"
      data-tk-session=""
      actions={[
        { label: extendLabel ?? w.extendLabel, onSelect: onExtend, busy, busyLabel: "Staying…" },
        { label: signOutLabel ?? w.signOutLabel, href: signOutHref, variant: "quiet" },
      ]}
    >
      {answers ?? null}
      <span data-tk="visually-hidden" role="status">{announcement ?? ""}</span>
    </Modal>
  );
}

export interface SessionTimeoutProps extends Omit<SessionTimeoutWarningProps, "open" | "remaining" | "onExtend" | "busy" | "announcement"> {
  /** Seconds without activity before the session ends. Default 900 (15 minutes). */
  timeout?: number;
  /** Seconds before the end to warn. Default 120 (2 minutes); never under 20. */
  warnBefore?: number;
  /** Keep the session alive on the server, without reloading the page. */
  onExtend: () => void | Promise<void>;
  /** The session has ended: go to the page that says so. */
  onTimeout: () => void;
  /** Off while there is no session (signed out). */
  enabled?: boolean;
  /** Seconds between spoken updates while warning. Default 15. */
  announceEvery?: number;
  /** Speak every second in the last this-many seconds. Default 20. */
  announceFinal?: number;
  /** Keep tabs of the same service in step (activity and staying in one count in all). */
  syncTabs?: boolean;
}

/**
 * SessionTimeout — warn before a session ends for inactivity, and let them
 * stay without losing anything.
 *
 * Any activity restarts the clock. `warnBefore` seconds before the end, a
 * dialog says when they will be signed out (or their answers deleted), with
 * a button to stay that takes focus and a link to leave; Escape stays too.
 * The time left is said every 15 seconds, then every second in the last 20.
 * Staying calls `onExtend` (a keep-alive, no reload); the end calls
 * `onTimeout`, which goes to a page saying what happened ("We signed you
 * out", "For your security, we deleted your answers") with a way to start
 * again. WCAG 2.2.1: a limit under 20 hours can be extended, with at least
 * 20 seconds' notice.
 */
export function SessionTimeout({ timeout = 900, warnBefore = 120, onExtend, onTimeout, enabled = true, announceEvery = 15, announceFinal = 20, syncTabs = false, ...face }: SessionTimeoutProps) {
  const warnAt = Math.max(20, Math.min(warnBefore, timeout));
  const deadline = useRef(Date.now() + timeout * 1000);
  const [remaining, setRemaining] = useState(timeout);
  const [warning, setWarning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);
  const ended = useRef(false);
  /* The callbacks change with every render of the page around this; the clock must not. */
  const onTimeoutRef = useRef(onTimeout);
  const onExtendRef = useRef(onExtend);
  onTimeoutRef.current = onTimeout;
  onExtendRef.current = onExtend;

  const restart = useCallback(() => { deadline.current = Date.now() + timeout * 1000; ended.current = false; setRemaining(timeout); setWarning(false); }, [timeout]);

  /* Activity restarts the clock, until the warning is up: then only Stay does. */
  useEffect(() => {
    if (!enabled) return;
    const onActivity = () => { if (!warning) { restart(); channel.current?.postMessage("activity"); } };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, onActivity, { passive: true });
    return () => { for (const e of events) window.removeEventListener(e, onActivity); };
  }, [enabled, warning, restart]);

  useEffect(() => {
    if (!enabled || !syncTabs || typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel("tk-session-timeout");
    ch.onmessage = () => restart();
    channel.current = ch;
    return () => { ch.close(); channel.current = null; };
  }, [enabled, syncTabs, restart]);

  useEffect(() => {
    if (!enabled) return;
    restart();
    const t = setInterval(() => {
      const left = (deadline.current - Date.now()) / 1000;
      setRemaining(left);
      if (left <= 0) { if (!ended.current) { ended.current = true; setWarning(false); onTimeoutRef.current(); } return; }
      if (left <= warnAt) setWarning(true);
    }, 1000);
    return () => clearInterval(t);
  }, [enabled, warnAt, restart]);

  /* Spoken: when it appears, every announceEvery seconds, then every second at the end. */
  const lastSaid = useRef<number | null>(null);
  useEffect(() => {
    if (!warning) { lastSaid.current = null; setSaid(""); return; }
    const s = Math.ceil(remaining);
    const due = lastSaid.current === null || s <= announceFinal || lastSaid.current - s >= announceEvery;
    if (due && s !== lastSaid.current) {
      lastSaid.current = s;
      const w = WORDS[face.variant ?? "signed-in"];
      setSaid((face.message ?? w.message)(timeLeft(s)));
    }
  }, [warning, remaining, announceEvery, announceFinal, face.variant, face.message]);

  const stay = async () => {
    if (busy) return;
    setBusy(true);
    try { await onExtendRef.current(); restart(); channel.current?.postMessage("extend"); } finally { setBusy(false); }
  };

  if (!enabled) return null;
  return <SessionTimeoutWarning {...face} open={warning} remaining={remaining} onExtend={stay} busy={busy} announcement={said} />;
}
