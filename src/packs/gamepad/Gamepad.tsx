/* React face of the gamepad pack. The elements do the work (they also run with no React,
   in the game); these wrappers only pass attributes and set the object-valued properties. */
import { useEffect, useRef, type CSSProperties } from "react";
import "./tk-gamepad.mjs";
import type { GamepadState, GamepadTheme, GlyphSet, Replay, ReplayFrame, ReplayMap, TkGamepadElement } from "./tk-gamepad.mjs";

type El = { ref?: unknown; class?: string; style?: CSSProperties; [attr: string]: unknown };
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "tk-gamepad": El;
      "tk-button-prompt": El;
      "tk-guitar": El;
    }
  }
}

export type GamepadProps = {
  /** boosty (cyan/magenta on black), dark or light. Any --tk-gamepad-* property overrides one colour. */
  theme?: GamepadTheme;
  /** Face-button marks: letters (A/B/X/Y), shapes or numbers. Positions never change. */
  glyphs?: GlyphSet;
  /** Space-separated positional names to outline, e.g. "up" or "south east". */
  highlight?: string;
  /** Breathe the highlight (off under prefers-reduced-motion and `calm`). */
  pulse?: boolean;
  /** No motion at all, whatever the OS says. */
  calm?: boolean;
  /** A multiple of 340px (1.5) or any CSS length ("100%", "12rem"). */
  size?: number | string;
  /** "live" reads the Gamepad API, "replay" plays a timeline; unset uses `state`. */
  source?: "live" | "replay";
  /** With source="live": which pad (navigator.getGamepads() index); unset = first connected. */
  index?: number;
  /** Accessible name. */
  label?: string;
  /** Show a one-line status (connected pad, raw mapping, replay time). */
  status?: boolean;
  /** Hand-fed state when there is no source. */
  state?: GamepadState;
  /** A createReplay() result or { frames, map, hold }. */
  replay?: Replay | { frames: ReplayFrame[]; map?: ReplayMap; hold?: number };
  /** Replay position in seconds (with `replay`). */
  currentTime?: number;
  className?: string;
  style?: CSSProperties;
};

export function Gamepad({ theme = "boosty", glyphs = "letters", highlight, pulse, calm, size, source, index, label, status, state, replay, currentTime, className, style }: GamepadProps) {
  const ref = useRef<TkGamepadElement>(null);
  useEffect(() => { if (ref.current && state && !source) ref.current.state = state; }, [state, source]);
  useEffect(() => { if (ref.current && replay) ref.current.replay = replay; }, [replay]);
  useEffect(() => { if (ref.current && replay && currentTime != null) ref.current.currentTime = currentTime; }, [replay, currentTime]);
  return (
    <tk-gamepad ref={ref} theme={theme} glyphs={glyphs} highlight={highlight || undefined} pulse={pulse ? "" : undefined} calm={calm ? "" : undefined}
      size={size != null ? String(size) : undefined} source={source} index={index != null ? String(index) : undefined} label={label} status={status ? "" : undefined} class={className} style={style} />
  );
}

export type ButtonPromptProps = {
  /** Positional name: south, east, west, north, lb, rb, lt, rt, up, down, left, right, ls, rs, view, menu, home, fret1-5. */
  btn: string;
  /** What it does here, e.g. "Fetch". */
  action?: string;
  /** What happens, after the action, e.g. "hold for a jet hover". */
  effect?: string;
  /** Override the control's spoken name (defaults to e.g. "D-pad up"). */
  label?: string;
  glyphs?: GlyphSet;
  theme?: GamepadTheme;
  /** Lit: the control is the one to press now. */
  lit?: boolean;
  pulse?: boolean;
  /** Glyph and action only ("Ⓐ Fetch"); the control's name stays in the accessible label. */
  terse?: boolean;
};

export function ButtonPrompt({ btn, action, effect, label, glyphs = "letters", theme = "boosty", lit, pulse, terse }: ButtonPromptProps) {
  return <tk-button-prompt btn={btn} action={action} effect={effect || undefined} label={label} glyphs={glyphs} theme={theme} lit={lit ? "" : undefined} pulse={pulse ? "" : undefined} terse={terse ? "" : undefined} />;
}

export type GuitarProps = { theme?: GamepadTheme; size?: number | string; highlight?: string; pressed?: string[]; label?: string };

export function Guitar({ theme = "boosty", size, highlight, pressed, label }: GuitarProps) {
  const ref = useRef<HTMLElement & { state: GamepadState }>(null);
  useEffect(() => { if (ref.current) ref.current.state = { pressed: pressed ?? [] }; }, [pressed]);
  return <tk-guitar ref={ref} theme={theme} size={size != null ? String(size) : undefined} highlight={highlight} label={label} />;
}
