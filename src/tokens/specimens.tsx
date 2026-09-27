import { useLayoutEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { LogoLadder, type LogoStage } from "../react/primitives/LogoLadder";
import {
  BagelMark,
  DoorShopMark,
  MohaveMark,
  MuncheeseMark,
  TkMark,
  WandasMark,
} from "../brand/marks";
import NUDGES from "../brand/nudges.json";
import {
  Sub,
  TokenRow,
  judgePair,
  type PairSpec,
} from "./doc";

/**
 * Six brands, one contract.
 *
 * This page is the argument the rest of 02 Tokens has been building toward.
 * The grayscale ramp next door shows a contract with nothing in it; this
 * shows six unrelated identities filling the same slots, and a component that
 * cannot tell which one it is rendering.
 *
 * NOTHING HERE IS TRANSCRIBED. Every swatch, every hex and every ratio below
 * is read off a live element with getComputedStyle, after the cascade has
 * resolved it inside that brand's subtree. If a pack stops filling a slot the
 * row goes blank rather than staying correct, and if a pack is edited to a
 * failing pair the verdict turns red here before the gate catches it. A
 * specimen sheet with the values typed in underneath is a specimen sheet that
 * is wrong the first time somebody edits a pack.
 *
 * The packs are emitted from tools/gen-specimen-packs.mjs, which is also
 * where the reasoning behind each mapping lives.
 */

/* --- the specimens ---------------------------------------------------------
   Content only. Not one colour appears in this file: colour belongs to the
   packs, and a story that restated it would be a second source of truth for
   the exact thing the kit exists to keep in one place.
--------------------------------------------------------------------------- */
export type Specimen = {
  slug: string;
  name: string;
  word: string;
  tagline: string;
  body: string;
  sector: string;
  smStage: "mark" | "word";
  mark: ReactNode;
  /** Why this brand sits where it does on the ladder. */
  ladder: string;
  /**
   * Prose only. Every figure that goes with it — which colour moved, how far,
   * what the rejected probes cost — comes from src/brand/nudges.json, which
   * tools/gen-specimen-packs.mjs writes in the same pass that writes the
   * packs. An earlier version of this file had those numbers typed in from a
   * terminal run, on a page whose own copy says nothing here is transcribed.
   */
  colourNote?: string;
};

export const SPECIMENS: Specimen[] = [
  {
    slug: "tk",
    name: "TK",
    word: "Token Kit",
    tagline: "ToeKnee",
    body: "The house brand · prefixes the library · stands in for a client who has not arrived",
    sector: "house / system brand",
    smStage: "mark",
    mark: <TkMark />,
    ladder:
      "Mark and wordmark share their letters, so MARK arrives early — the monogram is not an abbreviation of the name, it is the name at a smaller size.",
  },
  {
    slug: "door-shop",
    name: "Door Shop",
    word: "DOOR SHOP",
    tagline: "Save more",
    body: "Save more. Door more. Everyday essentials.",
    sector: "big-box retail · spark + wordmark",
    smStage: "mark",
    mark: <DoorShopMark />,
    ladder:
      "Prefers LOCKUP. The spark is radial and has no reading direction, so it survives the square crop at ICON better than the name does.",
    colourNote:
      "Yellow does not ring on a light ground — a fact about yellow, not about this brand. Nudging it far enough produces a different colour rather than a rendition of this one, so yellow keeps the mark and the ICON tile, under ink, where there is no floor.",
  },
  {
    slug: "mohave",
    name: "Mohave",
    word: "mohave",
    tagline: "From cart to porch",
    body: "From cart to porch · desert-fast delivery",
    sector: "e-commerce · wordmark + arc",
    smStage: "word",
    mark: <MohaveMark />,
    ladder:
      "The only type-led brand in the set: smStage=\"word\". An arc is punctuation for a name, not a symbol that can carry one alone.",
    colourNote:
      "Ringing wants the orange darker; the dark ink label on top wants it lighter; there is nothing in between. So orange keeps the button, where it is excellent, and slate rings and fills the meter. A measurement, not a preference — the probes below are re-run every time the packs are written.",
  },
  {
    slug: "bathing-bagels",
    name: "Bathing Bagels",
    word: "Bathing Bagels",
    tagline: "Rise & dunk",
    body: "Hot coffee · soft bagels · morning rituals",
    sector: "breakfast / coffee · word + ring",
    smStage: "mark",
    mark: <BagelMark />,
    ladder:
      "Prefers MARK early. A ring stays a ring at any size a browser can draw, provided the hole survives — so it is drawn as a stroke, not as two filled circles.",
    colourNote:
      "Pink as stated fails under a cream label. The usual fix is to give the buttons to brown; a few percent of lightness is a better one. The nudged value clears the label with headroom, rings, and fills a meter — so pink does every job it was drawn for, and the mark still carries the stated hex.",
  },
  {
    slug: "wandas",
    name: "Wanda's",
    word: "Wanda's",
    tagline: "Cheeky comfort food",
    body: "Char-grilled · never frozen · cheeky comfort food",
    sector: "burger / comfort · custom word + badge",
    smStage: "word",
    mark: <WandasMark />,
    ladder:
      "Mark and wordmark are the same letter, so showing the mark alone at small sizes throws the rest of the name away for nothing. WORD at sm; the badge earns its place at ICON.",
  },
  {
    slug: "muncheese",
    name: "Muncheese",
    word: "Muncheese",
    tagline: "Road ready",
    body: "Fuel · snacks · critter-approved road stops",
    sector: "travel stop / snack · mascot hero",
    smStage: "mark",
    mark: <MuncheeseMark />,
    ladder:
      "The hard case. A face is five shapes and every one of them is a detail, so the reduction is decided in the drawing rather than discovered in a favicon.",
    colourNote:
      "Same story as Door Shop and a shade worse. Yellow does not ring on a light ground, so it stays on the mark and the tile, where there is no floor.",
  },
];

/* Ascending bands, not the ranges a spec usually draws. min-width is
   inclusive, so 80–160 / 160–280 overlap at every boundary. */
const LADDER: [LogoStage, string][] = [
  ["full", "≥ 420"],
  ["lockup", "≥ 280"],
  ["stack", "≥ 160"],
  ["word", "≥ 80"],
  ["mark", "≥ 80"],
  ["icon", "< 80"],
];

/* --- what each brand has to prove -----------------------------------------
   The same five pairs for all six, because the whole claim is that the
   contract does not bend per brand. The logo row is the exception and it
   carries its reason: WCAG 1.4.3 exempts text that is part of a logo or
   brand name, which is precisely why --tk-logo-* is a separate family from
   --tk-action-* and --tk-text-*. Two of these packs need that exemption —
   their brand colour is real and would fail as a button.
--------------------------------------------------------------------------- */
const PAIRS: PairSpec[] = [
  { token: "--tk-text-primary", against: "--tk-surface-default", kind: "textNormal" },
  { token: "--tk-action-text", against: "--tk-action-fill", kind: "textNormal" },
  { token: "--tk-focus-color", against: "--tk-surface-default", kind: "nonText" },
  { token: "--tk-line-strong", against: "--tk-surface-sunken", kind: "nonText" },
  {
    token: "--tk-logo-mark-ink",
    against: "--tk-surface-default",
    kind: "nonText",
    exempt: "logotype — WCAG 1.4.3 exempt",
  },
];

const SWATCHES = [
  "--tk-surface-default",
  "--tk-surface-sunken",
  "--tk-text-primary",
  "--tk-action-fill",
  "--tk-focus-color",
  "--tk-logo-mark-ink",
  "--tk-logo-tile",
];

/**
 * Read a brand's resolved tokens off its own subtree.
 *
 * One ref per card rather than one for the page, because that is the point
 * being demonstrated: custom properties resolve per element against inherited
 * context, so six packs are live in this document at once and each card reads
 * its own. A single page-level reader would return the root pack six times.
 */
function useBrandReader(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useLayoutEffect(() => {
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const read = (name: string): string => {
    const el = ref.current;
    if (!el) return "";
    return getComputedStyle(el).getPropertyValue(name).trim();
  };

  return { ref, read };
}

function Filmstrip({ spec }: { spec: Specimen }) {
  /* Three across, not six.

     A pinned stage still sizes itself from its container — `--_unit` is
     `7cqi`, which is the mechanism working, not a bug. So a six-across strip
     at this page width hands every stage a 200px box and renders the whole
     ladder at 14px, where FULL and MARK are equally illegible and the sheet
     proves nothing. Six columns is the right drawing for a Figma frame, which
     is as wide as it needs to be; three is the right one for a browser. */
  return (
    <div
      data-shell="grid"
      data-gap="2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))" }}
    >
      {LADDER.map(([stage, band]) => (
        <div
          key={stage}
          data-tk="card"
          data-variant="flat"
          data-gap="1"
        >
          <div data-shell="inline" data-gap="2" style={{ justifyContent: "space-between" }}>
            <strong
              style={{
                fontSize: "var(--tk-size-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {stage}
            </strong>
            <code style={{ fontSize: "var(--tk-size-xs)", opacity: 0.7 }}>{band}</code>
          </div>
          <div style={{ display: "grid", placeItems: "center", minBlockSize: "3.5rem" }}>
            <LogoLadder
              stage={stage}
              mark={spec.mark}
              word={spec.word}
              tagline={spec.tagline}
              smStage={spec.smStage}
              label={spec.name}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export type BrandView = "identity" | "tokens";

/**
 * One brand, seen one of two ways.
 *
 * The split is the reason this is a prop rather than two components. Both
 * views are the same subtree with the same pack resolving in it — an identity
 * and the token values that produce it are not two subjects, they are one
 * subject at two distances, and rendering them from one function is what
 * keeps them from drifting.
 */
export function BrandCard({
  spec,
  deps,
  view,
}: {
  spec: Specimen;
  deps: unknown[];
  view: BrandView;
}) {
  const { ref, read } = useBrandReader(deps);
  const judged = PAIRS.map((p) => judgePair(p, read));

  return (
    /* data-tk="card", not a div with a border-radius on it.

       The first version of this hand-rolled the card inline, and the radius
       gate failed: a container that sets border-radius without publishing
       --tk-radius-nested to its children leaves the concentric chain running
       on the value it was handed, so every rounded thing inside solves
       against the wrong outer corner. Invisible at the kit's 16px radius and
       obvious the moment a pack asked for 32. The card primitive does the
       publishing; writing one by hand in a design system repo is the mistake
       the primitive exists to prevent. */
    <section ref={ref} data-brand={spec.slug} data-tk="card">
      <div data-shell="stack" data-gap="4">
        <div data-shell="stack" data-gap="1">
          <div data-shell="inline" data-gap="3" style={{ alignItems: "center" }}>
            <div style={{ inlineSize: "22rem" }}>
              <LogoLadder
                mark={spec.mark}
                word={spec.word}
                tagline={spec.tagline}
                smStage={spec.smStage}
                label={spec.name}
              />
            </div>
          </div>
          <p style={{ margin: 0, color: "var(--tk-text-tertiary)", fontSize: "var(--tk-size-sm)" }}>
            {spec.sector}
          </p>
          <p style={{ margin: 0, color: "var(--tk-text-secondary)" }}>{spec.body}</p>
        </div>

        {/* Resolved values. `read` returns what the cascade produced inside
            this card, which is why the hexes match the pack and not this
            file — this file has none. */}
        {view === "tokens" ? (
        <div>
          {/* THE BRAND'S OWN RAMP, lightest to darkest.
 
              The pack's private values — the brand book as transcribed —
              rather than the contract slots below, which are jobs. This is
              the palette; that is what the palette was hired to do.
 
              Ordered by OKLab lightness, the same order the pack file emits,
              because a palette listed in the order a brand book presents
              itself (primary, press states, mark, then the greys) hides the
              fact that the greys are a ramp at all.
 
              Names come from src/brand/nudges.json, which the generator
              writes; values come from getComputedStyle on this card. Neither
              is typed here. A name is not a value — it is where to look. */}
          <Sub>Palette, lightest to darkest</Sub>
          <div
            data-shell="inline"
            data-gap="0"
            style={{ flexWrap: "wrap", marginBlockEnd: "var(--tk-space-4)" }}
          >
            {(NUDGES[spec.slug as keyof typeof NUDGES]?.ramp ?? []).map((key) => {
              const name = `--${NUDGES[spec.slug as keyof typeof NUDGES].prefix}-${key}`;
              const value = read(name);
              return (
                <div key={key} data-shell="stack" data-gap="1" style={{ inlineSize: "5.5rem" }}>
                  <span
                    title={`${name}: ${value}`}
                    style={{
                      display: "block",
                      blockSize: "3rem",
                      background: value,
                      border: "1px solid var(--tk-line-subtle)",
                    }}
                  />
                  <code
                    style={{
                      fontSize: "var(--tk-size-xs)",
                      wordBreak: "break-word",
                      paddingInline: "var(--tk-space-1)",
                    }}
                  >
                    {key}
                  </code>
                  <span
                    style={{
                      fontSize: "var(--tk-size-xs)",
                      color: "var(--tk-text-tertiary)",
                      paddingInline: "var(--tk-space-1)",
                    }}
                  >
                    {value || "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* THE GRADIENT, beside the palette it was taken from.
 
              A gradient is the one contract slot that cannot be shown as a
              swatch, because it is a pair and a direction rather than a
              value — so it was missing from this page entirely while every
              flat colour was on it. The strip is painted by [data-gradient],
              which reads the same two slots listed under it, so the picture
              and the numbers cannot disagree.
 
              The two ends are this brand's `paint` pair, the same one the
              texture cuts its mask out of. One declaration in the generator's
              table, two things on this card. */}
          <Sub>Gradient</Sub>
          <div data-shell="stack" data-gap="2" style={{ marginBlockEnd: "var(--tk-space-4)" }}>
            <div
              data-gradient=""
              data-direction="inline-end"
              style={{
                blockSize: "3rem",
                borderRadius: "var(--tk-radius-sm)",
                border: "1px solid var(--tk-line-default)",
              }}
              aria-hidden="true"
            />
            <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
              {["--tk-gradient-from", "--tk-gradient-to"].map((name) => {
                const value = read(name);
                return (
                  <div key={name} data-shell="stack" data-gap="1" style={{ inlineSize: "9rem" }}>
                    <span
                      style={{
                        display: "block",
                        blockSize: "1.75rem",
                        background: value,
                        borderRadius: "var(--tk-radius-sm)",
                        border: "1px solid var(--tk-line-default)",
                      }}
                    />
                    <code style={{ fontSize: "var(--tk-size-xs)" }}>
                      {name.replace("--tk-gradient-", "")}
                    </code>
                    <span
                      style={{ fontSize: "var(--tk-size-xs)", color: "var(--tk-text-tertiary)" }}
                    >
                      {value || "—"}
                    </span>
                  </div>
                );
              })}
              {["--tk-gradient-angle", "--tk-gradient-stop"].map((name) => (
                <div key={name} data-shell="stack" data-gap="1" style={{ inlineSize: "9rem" }}>
                  <span style={{ display: "block", blockSize: "1.75rem" }} />
                  <code style={{ fontSize: "var(--tk-size-xs)" }}>
                    {name.replace("--tk-gradient-", "")}
                  </code>
                  <span
                    style={{ fontSize: "var(--tk-size-xs)", color: "var(--tk-text-tertiary)" }}
                  >
                    {read(name) || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Sub>Resolved in this subtree</Sub>
          <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
            {SWATCHES.map((name) => {
              const value = read(name);
              return (
                <div key={name} data-shell="stack" data-gap="1" style={{ inlineSize: "7.5rem" }}>
                  <span
                    style={{
                      display: "block",
                      blockSize: "2.5rem",
                      background: value,
                      borderRadius: "var(--tk-radius-sm)",
                      border: "1px solid var(--tk-line-default)",
                    }}
                  />
                  <code style={{ fontSize: "var(--tk-size-xs)", wordBreak: "break-all" }}>
                    {name.replace("--tk-", "")}
                  </code>
                  <span
                    style={{ fontSize: "var(--tk-size-xs)", color: "var(--tk-text-tertiary)" }}
                  >
                    {value || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        ) : null}

        {view === "tokens" ? (
        <>
        {/* Solved, not typed. Two swatches of the same hue at different
            lightness is the argument in one row: the brand did not have to be
            replaced to pass, only moved. The figures come from the same pass
            that wrote the pack, so a constraint change moves both or neither. */}
        {(() => {
          const solved = NUDGES[spec.slug as keyof typeof NUDGES];
          if (!solved) return null;
          const nudged = solved.nudged.filter((n) => n.fromStated);
          const rejected = solved.rejected;
          if (!nudged.length && !rejected.length) return null;
          return (
            <div data-shell="stack" data-gap="3">
              {spec.colourNote ? (
                <div>
                  <Sub>{nudged.length ? "Nudged, not replaced" : "Nudge tried and rejected"}</Sub>
                  <p
                    className="tk-doc-note"
                    style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}
                  >
                    {spec.colourNote}
                  </p>
                </div>
              ) : null}

              {nudged.map((n) => (
                <div key={n.key} data-shell="inline" data-gap="3" style={{ alignItems: "center" }}>
                  <div data-shell="inline" data-gap="0">
                    <span
                      title={`stated ${n.from}`}
                      style={{
                        display: "block",
                        inlineSize: "4rem",
                        blockSize: "2.75rem",
                        background: n.from,
                        borderStartStartRadius: "var(--tk-radius-sm)",
                        borderEndStartRadius: "var(--tk-radius-sm)",
                      }}
                    />
                    <span
                      title={`ui ${n.to}`}
                      style={{
                        display: "block",
                        inlineSize: "4rem",
                        blockSize: "2.75rem",
                        background: n.to,
                        borderStartEndRadius: "var(--tk-radius-sm)",
                        borderEndEndRadius: "var(--tk-radius-sm)",
                      }}
                    />
                  </div>
                  <code style={{ fontSize: "var(--tk-size-xs)" }}>
                    {n.key} · {n.from} → {n.to} · L {n.dl > 0 ? "+" : "−"}
                    {Math.abs(n.dl).toFixed(1)} · ΔE {n.deltaE.toFixed(4)} · {n.verdict}
                  </code>
                </div>
              ))}

              {rejected.length ? (
                <div>
                  <Sub>Probed and rejected</Sub>
                  {rejected.map((r) => (
                    <TokenRow
                      key={r.label}
                      name={r.label}
                      value={r.to ?? "—"}
                      swatch={r.to ?? r.from}
                      state={r.to ? "note" : "fail"}
                      verdict={
                        r.to
                          ? `${r.from} → ${r.to} · ΔE ${r.deltaE!.toFixed(4)} · ${r.verdict}`
                          : "no value on this hue satisfies every constraint"
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })()}

        <div>
          <Sub>The same five pairs, judged here</Sub>
          {judged.map((r) => (
            <TokenRow
              key={r.token + r.against}
              name={`${r.token.replace("--tk-", "")} on ${r.against.replace("--tk-", "")}`}
              value={r.value}
              swatch={r.value}
              verdict={r.verdict}
              state={r.state}
            />
          ))}
        </div>
        </>
        ) : null}

        {view === "identity" ? (
        <div>
          <Sub>Ladder</Sub>
          <p
            className="tk-doc-note"
            style={{ margin: "0 0 var(--tk-space-3)", maxInlineSize: "var(--tk-measure)" }}
          >
            {spec.ladder}
          </p>
          <Filmstrip spec={spec} />
        </div>
        ) : null}
      </div>
    </section>
  );
}

