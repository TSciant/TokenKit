/* React face of the keyboard pack. The elements do the work (they also run with no React,
   in a game); these wrappers only pass attributes and set the object-valued properties. */
import { useEffect, useRef, type CSSProperties } from "react";
import "./tk-keyboard.mjs";
import type { KeyboardKeyDetail, KeyboardTheme, KeyReplay, KeyReplayFrame, KeyReplayMap, KeyState, TkKeyboardElement } from "./tk-keyboard.mjs";

type El = { ref?: unknown; class?: string; style?: CSSProperties; [attr: string]: unknown };
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "tk-keyboard": El;
      "tk-key-prompt": El;
    }
  }
}

export type KeyboardProps = {
  /** Clusters and single codes to draw: "wasd arrows space shift" (the default), "numbers KeyF KeyR", "esc tab ctrl enter fkeys". */
  keys?: string;
  /** boosty (cyan/magenta on black), dark or light. Any --tk-keyboard-* property overrides one colour. */
  theme?: KeyboardTheme;
  /** Space-separated codes (or cluster names) to outline, e.g. "KeyW" or "KeyW Space". */
  highlight?: string;
  /** Breathe the highlight (off under prefers-reduced-motion, `calm` and the kit's motion pause). */
  pulse?: boolean;
  /** No motion at all, whatever the OS says. */
  calm?: boolean;
  /** A multiple of the natural width (44px a key; 0.6) or any CSS length ("100%", "20rem"). Never wider than its container. */
  size?: number | string;
  /** "live" reads keydown / keyup by position, "replay" plays a timeline; unset uses `state`. */
  source?: "live" | "replay";
  /** With source="live": also read keys while focus is in a field (ignored by default). */
  capture?: boolean;
  /** "auto" shows the layout's own letters where the browser offers them; "us" always shows US caps. */
  layout?: "auto" | "us";
  /** Your own cap letters by code, e.g. a game's key settings ({ KeyW: "z" }). They win over the browser's layout map. */
  labels?: Record<string, string>;
  /** Accessible name; defaults to the keys drawn ("Keyboard: W A S D (with Q and E), arrow keys, ..."). */
  label?: string;
  /** Show a one-line status (what the source is; never what was pressed). */
  status?: boolean;
  /** Hand-fed state when there is no source: { pressed: ["KeyW", "ShiftLeft"] }. */
  state?: KeyState;
  /** A createKeyReplay() result or { frames, map, hold }. */
  replay?: KeyReplay | { frames: KeyReplayFrame[]; map?: KeyReplayMap; hold?: number };
  /** Replay position in seconds (with `replay`). */
  currentTime?: number;
  /** Called on every press and release from live input (not on auto-repeat). */
  onKey?: (detail: KeyboardKeyDetail) => void;
  className?: string;
  style?: CSSProperties;
};

export function Keyboard({ keys, theme = "boosty", highlight, pulse, calm, size, source, capture, layout, labels, label, status, state, replay, currentTime, onKey, className, style }: KeyboardProps) {
  const ref = useRef<TkKeyboardElement>(null);
  useEffect(() => { if (ref.current && state && !source) ref.current.state = state; }, [state, source]);
  /* highlight is also the element's method, and React 19 would assign a prop of that name as a property: set the attribute. */
  useEffect(() => { const el = ref.current; if (!el) return; if (highlight) el.setAttribute("highlight", highlight); else el.removeAttribute("highlight"); }, [highlight]);
  useEffect(() => { if (ref.current && replay) ref.current.replay = replay; }, [replay]);
  useEffect(() => { const el = ref.current; if (!el || !labels) return; el.labels = labels; return () => { el.labels = null; }; }, [labels]);
  useEffect(() => { if (ref.current && replay && currentTime != null) ref.current.currentTime = currentTime; }, [replay, currentTime]);
  useEffect(() => {
    const el = ref.current; if (!el || !onKey) return;
    const h = (e: Event) => onKey((e as CustomEvent<KeyboardKeyDetail>).detail);
    el.addEventListener("tk-keyboard-key", h); return () => el.removeEventListener("tk-keyboard-key", h);
  }, [onKey]);
  return (
    <tk-keyboard ref={ref} keys={keys || undefined} theme={theme} pulse={pulse ? "" : undefined} calm={calm ? "" : undefined}
      size={size != null ? String(size) : undefined} source={source} capture={capture ? "" : undefined} layout={layout} label={label || undefined} status={status ? "" : undefined} class={className} style={style} />
  );
}

export type KeyPromptProps = {
  /** The key, by position (KeyboardEvent.code): KeyW, Space, ShiftLeft, ArrowUp... (the element's `key` attribute; React keeps `key` for itself). */
  code: string;
  /** What it does here, e.g. "Move forward". */
  action?: string;
  /** Override the key's spoken name (defaults to e.g. "W key", "Space bar"). */
  label?: string;
  theme?: KeyboardTheme;
  /** Lit: the key is the one to press now. */
  lit?: boolean;
  pulse?: boolean;
  /** "auto" shows the layout's own letter where the browser offers it; "us" always the US cap. */
  layout?: "auto" | "us";
  /** Your own cap letters by code, as on Keyboard. */
  labels?: Record<string, string>;
};

export function KeyPrompt({ code, action, label, theme = "boosty", lit, pulse, layout, labels }: KeyPromptProps) {
  const ref = useRef<HTMLElement & { labels: Record<string, string> | null }>(null);
  useEffect(() => { const el = ref.current; if (!el || !labels) return; el.labels = labels; return () => { el.labels = null; }; }, [labels]);
  return <tk-key-prompt ref={ref} code={code} action={action || undefined} label={label || undefined} theme={theme} lit={lit ? "" : undefined} pulse={pulse ? "" : undefined} layout={layout} />;
}
