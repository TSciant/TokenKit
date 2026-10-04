/** Motion FX contract — progressive enhancement over static markup. */

export type FxReveal = "rise" | "fade" | "zoom" | "blur-rise";

/** Where the host sits in the composition — used when fx is a boolean. */
export type FxContext =
  | "card"
  | "media"
  | "figure"
  | "plate"
  | "plate-stock"
  | "plate-hero"
  | "section"
  | "default";

export type FxProps = {
  /** Enter when the box intersects the viewport. */
  reveal?: FxReveal | false;
  /**
   * Parallax intensity against scroll (0–0.4 typical).
   * Applied as --tk-fx-y on the element; CSS does the transform.
   */
  parallax?: number | false;
  /** Fire reveal once (default true). */
  once?: boolean;
  /** IO rootMargin, e.g. "0px 0px -10% 0px". */
  rootMargin?: string;
  /** IO threshold 0–1 (default 0.12). */
  threshold?: number;
};

/**
 * Shorthand:
 * - true → infer reveal + parallax from FxContext
 * - string → that reveal only
 * - object → explicit recipe
 */
export type FxProp = boolean | FxReveal | FxProps;

/* What `fx={true}` means in each place. No context reveals.

   Every recipe here used to enter (rise, fade, blur-rise) as it scrolled into
   view. The kit no longer does that: something that animates because it
   arrived is a reveal, and reveals cost the reader a beat on every section
   while proving nothing about the layout. What stays is parallax, which is
   scroll-LINKED (it moves exactly as far as you scroll, and stops when you
   do) rather than scroll-TRIGGERED. An explicit `fx="rise"` still works for
   a product that wants one; the kit's own patterns never ask. */
const INFER: Record<FxContext, FxProps> = {
  card: { reveal: false, parallax: 0.1, once: true },
  media: { reveal: false, parallax: 0.08, once: true },
  figure: { reveal: false, parallax: 0.12, once: true },
  plate: { reveal: false, parallax: 0.06, once: true },
  "plate-stock": { reveal: false, parallax: 0.14, once: true },
  "plate-hero": { reveal: false, parallax: 0.2, once: true },
  section: { reveal: false, parallax: 0.08, once: true },
  default: { reveal: false, parallax: 0.1, once: true },
};

/** Infer a recipe from where the host lives. */
export function inferFx(context: FxContext = "default"): FxProps {
  return { ...INFER[context] };
}

/**
 * Resolve fx to a concrete recipe.
 * Boolean true uses context inference instead of a single global preset.
 */
export function normalizeFx(
  fx: FxProp | undefined,
  context: FxContext = "default",
): FxProps | null {
  if (fx == null || fx === false) return null;

  const base = {
    once: true as const,
    threshold: 0.12,
    rootMargin: "0px 0px -8% 0px",
  };

  if (fx === true) {
    return { ...base, ...inferFx(context) };
  }

  if (typeof fx === "string") {
    return { ...base, reveal: fx };
  }

  return { ...base, ...inferFx(context), ...fx };
}

/** Plate helper: pick plate / plate-stock / plate-hero from props. */
export function plateFxContext(opts: {
  stock?: boolean;
  src?: string;
  bleed?: boolean | "full";
}): FxContext {
  const hasPhoto = Boolean(opts.stock || opts.src);
  const hero = opts.bleed === true || opts.bleed === "full";
  if (hasPhoto && hero) return "plate-hero";
  if (hasPhoto) return "plate-stock";
  return "plate";
}
