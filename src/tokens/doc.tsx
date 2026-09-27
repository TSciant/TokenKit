import { useLayoutEffect, useReducer, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { contrastRatio, format, THRESHOLD } from "../lib/contrast";
import type { ContrastKind } from "../lib/contrast";

/**
 * Reads token values the only way that is honest: off a real element, after
 * the cascade has resolved them in whatever context that element sits in.
 *
 * `deps` are the Storybook globals. When the pack, density or root size
 * changes the decorator re-renders, deps change, and every value here is read
 * again. Nothing on these pages is transcribed from the source files — if a
 * pack stops filling a slot, the row goes blank rather than staying correct.
 */
export function useTokenReader(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [nonce, bump] = useReducer((n: number) => n + 1, 0);

  useLayoutEffect(() => {
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const read = (name: string): string => {
    const el = ref.current;
    if (!el) return "";
    return getComputedStyle(el).getPropertyValue(name).trim();
  };

  const readPx = (name: string): number => parseFloat(read(name)) || 0;

  return { ref, read, readPx, nonce };
}

export interface ContextGlobals {
  pack: string;
  density: string;
  root: string;
}

export function Page({
  title,
  note,
  hostRef,
  children,
  spec,
}: {
  title: string;
  note: ReactNode;
  hostRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  spec?: ReactNode;
}) {
  return (
    <div ref={hostRef}>
      <h1 className="tk-doc-title">{title}</h1>
      <p className="tk-doc-note">{note}</p>
      {children}
      {spec ? <p className="tk-doc-spec">{spec}</p> : null}
    </div>
  );
}

export function Sub({ children }: { children: ReactNode }) {
  return <p className="tk-doc-sub">{children}</p>;
}

/** One token: swatch, name, resolved value, and a verdict when one applies. */
export function TokenRow({
  name,
  value,
  verdict,
  state,
  swatch,
}: {
  name: string;
  value: string;
  verdict?: string;
  state?: "pass" | "fail" | "note";
  swatch?: string;
}) {
  return (
    <div className="tk-row">
      <span className="tk-swatch" style={{ background: swatch ?? value }} />
      <code>{name}</code>
      <span className="tk-value">{value || "—"}</span>
      <span className="tk-verdict" data-state={state ?? "note"}>
        {verdict ?? ""}
      </span>
    </div>
  );
}

export interface PairSpec {
  /** The token under test. */
  token: string;
  /** What it sits on. */
  against: string;
  kind: ContrastKind;
  /** Set when the pair carries no requirement — with the reason. */
  exempt?: string;
}

export interface PairResult extends PairSpec {
  value: string;
  backdrop: string;
  ratio: number | null;
  required: number;
  pass: boolean;
  state: "pass" | "fail" | "note";
  verdict: string;
}

/**
 * Judge a pair, honouring exemptions.
 *
 * A checker that reports a non-requirement as a failure trains people to
 * ignore it, so disabled text and decorative rules carry their reason instead
 * of a red mark.
 */
export function judgePair(
  spec: PairSpec,
  read: (n: string) => string,
): PairResult {
  const value = read(spec.token);
  const backdrop = read(spec.against);
  const ratio = contrastRatio(value, backdrop);
  const required = THRESHOLD[spec.kind];
  const pass = ratio != null && ratio >= required;

  return {
    ...spec,
    value,
    backdrop,
    ratio,
    required,
    pass,
    state: spec.exempt ? "note" : pass ? "pass" : "fail",
    verdict: spec.exempt
      ? `${format(ratio)} · ${spec.exempt}`
      : `${format(ratio)}${pass ? "" : ` · needs ${required}:1`}`,
  };
}

/** The 14 greys, in ramp order. The only literals in the kit. */
export const RAMP_STEPS = [
  0, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000,
] as const;

export const SPACE_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const TYPE_STEPS = [
  "xs",
  "sm",
  "base",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
] as const;

export const RADIUS_STEPS = ["none", "sm", "md", "lg", "full"] as const;
