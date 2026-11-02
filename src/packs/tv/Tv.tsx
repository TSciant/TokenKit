/* React face of the TV pack. The elements do the work (they also run with no React, on a
   box or in a game); these wrappers only pass attributes and listen for the pack's events. */
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import "./tk-tv.mjs";
import type { TvAccent, TvOsdKind, TvSelectDetail, TvTheme, TvVerbDetail } from "./tk-tv.mjs";

type El = { ref?: unknown; class?: string; style?: CSSProperties; children?: ReactNode; [attr: string]: unknown };
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "tk-tv-shell": El;
      "tk-tv-row": El;
      "tk-tv-tile": El;
      "tk-tv-sidebar": El;
      "tk-tv-osd": El;
    }
  }
}

const flag = (b?: boolean) => (b ? "" : undefined);
/* One listener for one of the pack's CustomEvents, kept current. */
function useTvEvent<D>(ref: RefObject<HTMLElement | null>, type: string, fn?: (d: D) => void) {
  useEffect(() => {
    const el = ref.current; if (!el || !fn) return;
    const h = (e: Event) => fn((e as CustomEvent<D>).detail);
    el.addEventListener(type, h); return () => el.removeEventListener(type, h);
  }, [ref, type, fn]);
}

export type TvShellProps = {
  /** boosty (cyan ring on black), dark or light. Rows, tiles and the sidebar inside inherit it; any --tk-tv-* property overrides one value. */
  theme?: TvTheme;
  /** The screen's accessible name (a labelled region). */
  label?: string;
  /** What drives focus: "keys" (arrow keys, Enter, Backspace, Escape, while focus is inside), "pad" (a gamepad), "keys pad", or "none". */
  input?: "keys" | "pad" | "keys pad" | "none";
  /** Also read keys while focus is in a text field (ignored by default). */
  capture?: boolean;
  /** Draw the action-safe, title-safe and safe-area guides (a development aid). */
  guides?: boolean;
  /** Hold a 16:9 frame with the rows scrolling inside it, as a screen does (auto height below 600px wide). */
  screen?: boolean;
  /** No motion at all, whatever the OS says: no lift, no fades, no smooth scrolling. */
  calm?: boolean;
  /** Every verb the remote sends ({ verb, dir, source, code }). */
  onVerb?: (detail: TvVerbDetail) => void;
  /** A tile was chosen (click, Enter, A or the remote's select). */
  onSelect?: (detail: TvSelectDetail) => void;
  /** Back with nowhere left to go back to: the host decides (close, confirm, ignore). */
  onExit?: () => void;
  /** A <TvSidebar> (it takes the menu slot by itself), rows, and anything with slot="overlay". */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function TvShell({ theme = "boosty", label, input = "keys", capture, guides, screen, calm, onVerb, onSelect, onExit, children, className, style }: TvShellProps) {
  const ref = useRef<HTMLElement>(null);
  useTvEvent<TvVerbDetail>(ref, "tk-tv-verb", onVerb);
  useTvEvent<TvSelectDetail>(ref, "tk-tv-select", onSelect);
  useTvEvent<null>(ref, "tk-tv-exit", onExit ? () => onExit() : undefined);
  return (
    <tk-tv-shell ref={ref} theme={theme} label={label || undefined} input={input} capture={flag(capture)} guides={flag(guides)} screen={flag(screen)} calm={flag(calm)} class={className} style={style}>
      {children}
    </tk-tv-shell>
  );
}

export type TvRowProps = {
  /** The row's visible title, also its accessible name ("Films"). */
  label?: string;
  /** "row" scrolls sideways to keep focus in view; "grid" wraps the tiles into lines. */
  layout?: "row" | "grid";
  /** Heading level of the title, 2 to 6. */
  level?: 2 | 3 | 4 | 5 | 6;
  theme?: TvTheme;
  /** TvTile elements. */
  children?: ReactNode;
};

export function TvRow({ label, layout = "row", level, theme, children }: TvRowProps) {
  return <tk-tv-row label={label || undefined} layout={layout === "grid" ? "grid" : undefined} level={level != null ? String(level) : undefined} theme={theme}>{children}</tk-tv-row>;
}

export type TvTileProps = {
  /** The tile's title and accessible name ("Films"). */
  label: string;
  /** A second line ("Living-room catalog"); read as the tile's description. */
  sub?: string;
  /** An image for the art area (16:9). Without one, the art is a gradient in the accent. */
  image?: string;
  /** Alternative text for the image; empty (decorative) by default, since the label names the tile. */
  alt?: string;
  /** emerald, violet, amber, cyan, pink or none: a bar and a tint. Decoration only, never status. */
  accent?: TvAccent;
  /** A word on the art ("New", "Live"): status in words, never colour alone. */
  badge?: string;
  /** Makes the tile a link. */
  href?: string;
  /** Shown but not chosen, and skipped by spatial focus. */
  disabled?: boolean;
  /** aria-current for the tile that is playing or open ("true", "page"). */
  current?: string;
  /** Draw the focus ring without focus: a picture of the state, or a kiosk whose window has lost the system's focus. Real focus draws it anyway. */
  focused?: boolean;
  theme?: TvTheme;
  /** Chosen: a click, Enter, A, or the remote's select. */
  onSelect?: (detail: TvSelectDetail) => void;
};

export function TvTile({ label, sub, image, alt, accent, badge, href, disabled, current, focused, theme, onSelect }: TvTileProps) {
  const ref = useRef<HTMLElement>(null);
  useTvEvent<TvSelectDetail>(ref, "tk-tv-select", onSelect);
  return <tk-tv-tile ref={ref} label={label} sub={sub || undefined} image={image || undefined} alt={alt || undefined} accent={accent} badge={badge || undefined} href={href || undefined} disabled={flag(disabled)} current={current || undefined} focused={flag(focused)} theme={theme} />;
}

export type TvSidebarProps = {
  /** The menu's accessible name (a labelled nav). */
  label?: string;
  /** A slim rail until focus comes in, then full width with labels. Put an icon first in each item. */
  collapse?: boolean;
  theme?: TvTheme;
  /** Links or buttons, one per item; mark the open one with aria-current="page". */
  children?: ReactNode;
};

export function TvSidebar({ label, collapse, theme, children }: TvSidebarProps) {
  return <tk-tv-sidebar label={label || undefined} collapse={flag(collapse)} theme={theme}>{children}</tk-tv-sidebar>;
}

export type TvOsdProps = {
  /** volume (a level and a number, or Muted), now-playing (a title, a line and progress) or message. */
  kind?: TvOsdKind;
  /** 0 to 100: the volume, or how far through the now-playing item. */
  value?: number;
  /** Volume only: shows the slashed speaker and the word Muted. */
  muted?: boolean;
  /** Now playing: the title. Message: the text. */
  label?: string;
  /** A second line ("1:24 of 3:30"). */
  detail?: string;
  /** Now playing: paused (the pause mark and the word Paused). */
  paused?: boolean;
  /** Shown. It fades after `timeout` unless `persist` is set. */
  open?: boolean;
  /** Stay shown until closed. */
  persist?: boolean;
  /** Milliseconds before it fades (at least 1000; 3000 by default). */
  timeout?: number;
  theme?: TvTheme;
  /** No fade or slide. */
  calm?: boolean;
};

export function TvOsd({ kind = "volume", value, muted, label, detail, paused, open, persist, timeout, theme, calm }: TvOsdProps) {
  return <tk-tv-osd kind={kind} value={value != null ? String(value) : undefined} muted={flag(muted)} label={label || undefined} detail={detail || undefined} paused={flag(paused)} open={flag(open)} persist={flag(persist)} timeout={timeout != null ? String(timeout) : undefined} theme={theme} calm={flag(calm)} />;
}
