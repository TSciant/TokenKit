/* React face of the instruments pack. The elements do the work (they also run with no React,
   in a game); these wrappers only pass attributes and set the object-valued properties. */
import { useEffect, useRef, type CSSProperties } from "react";
import "./tk-guitar-neck.mjs";
import "./tk-piano-keys.mjs";
import type { GuitarBinding, GuitarNote, TkGuitarNeckElement } from "./tk-guitar-neck.mjs";
import type { PianoBinding, PianoKey, TkPianoKeysElement } from "./tk-piano-keys.mjs";

type El = { ref?: unknown; class?: string; style?: CSSProperties; [attr: string]: unknown };
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "tk-guitar-neck": El;
      "tk-piano-keys": El;
    }
  }
}

/** boosty (cyan/magenta on black), dark or light. Any --tk-gamepad-* property overrides one colour. */
export type InstrumentTheme = "boosty" | "dark" | "light";

export type GuitarNeckProps = {
  /** Frets drawn (5 to 22). */
  frets?: number;
  /** Positions to ring, e.g. "s6f5 s5f7" (string 1 high e .. 6 low E, fret 0 open). */
  highlight?: string;
  /** Breathe the rings (off under prefers-reduced-motion and `calm`). */
  pulse?: boolean;
  /** No motion at all: strings don't vibrate, rings don't breathe. */
  calm?: boolean;
  /** Play real recordings when a position is played (fetches about 0.6 MB on first note). */
  sound?: boolean;
  theme?: InstrumentTheme;
  /** A multiple of 640px or any CSS length; unset fills the width. */
  size?: number | string;
  label?: string;
  /** Held positions ("s6f5") and/or controller buttons (fret1..5; strum plays what is held). */
  pressed?: string[];
  /** Controller button to position, e.g. { fret1: "s6f5" }. */
  binding?: GuitarBinding;
  onNote?: (note: GuitarNote) => void;
  className?: string;
  style?: CSSProperties;
};

/* Every attribute is set from an effect, never as a JSX prop: React 19 assigns a prop whose
   name exists on the element as a property, which would shadow pluck/strum-style members. */
export function GuitarNeck({ frets, highlight, pulse, calm, sound, theme = "boosty", size, label, pressed, binding, onNote, className, style }: GuitarNeckProps) {
  const ref = useRef<TkGuitarNeckElement>(null);
  const attrs: Record<string, string | undefined> = { frets: frets != null ? String(frets) : undefined, highlight: highlight || undefined, pulse: pulse ? "" : undefined, calm: calm ? "" : undefined, sound: sound ? "" : undefined, theme, size: size != null ? String(size) : undefined, label };
  const key = JSON.stringify(attrs);
  useEffect(() => { const el = ref.current; if (!el) return; for (const [n, v] of Object.entries(attrs)) { if (v == null) el.removeAttribute(n); else if (el.getAttribute(n) !== v) el.setAttribute(n, v); } }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ref.current && binding) ref.current.binding = binding; }, [binding]);
  useEffect(() => { if (ref.current) ref.current.state = { pressed: pressed ?? [] }; }, [pressed]);
  useEffect(() => { const el = ref.current; if (!el || !onNote) return; const h = (e: Event) => onNote((e as CustomEvent<GuitarNote>).detail); el.addEventListener("tk-guitar-note", h); return () => el.removeEventListener("tk-guitar-note", h); }, [onNote]);
  return <tk-guitar-neck ref={ref} class={className} style={style} />;
}

export type PianoKeysProps = {
  /** A standard keyboard size: 25 (C3-C5), 37, 49, 61, 76 or 88 (A0-C8). */
  keys?: 25 | 37 | 49 | 61 | 76 | 88;
  /** Any other span, white key to white key, e.g. "F3-F5"; wins over `keys`. */
  range?: string;
  /** Keys to mark with a dot, e.g. "C4 E4 G4". */
  highlight?: string;
  /** Breathe the dots (off under prefers-reduced-motion and `calm`). */
  pulse?: boolean;
  /** No motion at all: keys go down without travelling, dots don't breathe. */
  calm?: boolean;
  /** Play real recordings when a key goes down (fetches the notes it needs, up to about 1.3 MB). */
  sound?: boolean;
  theme?: InstrumentTheme;
  /** A multiple of 640px or any CSS length; unset fills the width. */
  size?: number | string;
  label?: string;
  /** Keys held down ("C4") and/or gamepad buttons read through `binding`. */
  pressed?: string[];
  /** Gamepad button to note name, or "sustain", e.g. { south: "D4", rt: "sustain" }. */
  binding?: PianoBinding;
  /** The sustain pedal. */
  sustain?: boolean;
  onNote?: (key: PianoKey) => void;
  onRelease?: (key: PianoKey) => void;
  className?: string;
  style?: CSSProperties;
};

/* As GuitarNeck: every attribute from an effect, so React 19 never shadows press/play/release. */
export function PianoKeys({ keys, range, highlight, pulse, calm, sound, theme = "boosty", size, label, pressed, binding, sustain, onNote, onRelease, className, style }: PianoKeysProps) {
  const ref = useRef<TkPianoKeysElement>(null);
  const attrs: Record<string, string | undefined> = { keys: keys != null ? String(keys) : undefined, range: range || undefined, highlight: highlight || undefined, pulse: pulse ? "" : undefined, calm: calm ? "" : undefined, sound: sound ? "" : undefined, theme, size: size != null ? String(size) : undefined, label };
  const key = JSON.stringify(attrs);
  useEffect(() => { const el = ref.current; if (!el) return; for (const [n, v] of Object.entries(attrs)) { if (v == null) el.removeAttribute(n); else if (el.getAttribute(n) !== v) el.setAttribute(n, v); } }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ref.current && binding) ref.current.binding = binding; }, [binding]);
  useEffect(() => { if (ref.current) ref.current.state = { pressed: pressed ?? [] }; }, [pressed]);
  useEffect(() => { if (ref.current && sustain != null) ref.current.sustain = sustain; }, [sustain]);
  useEffect(() => { const el = ref.current; if (!el || !onNote) return; const h = (e: Event) => onNote((e as CustomEvent<PianoKey>).detail); el.addEventListener("tk-piano-note", h); return () => el.removeEventListener("tk-piano-note", h); }, [onNote]);
  useEffect(() => { const el = ref.current; if (!el || !onRelease) return; const h = (e: Event) => onRelease((e as CustomEvent<PianoKey>).detail); el.addEventListener("tk-piano-release", h); return () => el.removeEventListener("tk-piano-release", h); }, [onRelease]);
  return <tk-piano-keys ref={ref} class={className} style={style} />;
}
