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

const INFER: Record<FxContext, FxProps> = {
  /** Cards: crisp rise, light drift. */
  card: { reveal: "rise", parallax: 0.1, once: true },
  /** Media objects: softer rise. */
  media: { reveal: "rise", parallax: 0.08, once: true },
  /** Figures: photographic — blur-rise + medium parallax. */
  figure: { reveal: "blur-rise", parallax: 0.12, once: true },
  /** Synthetic plate (no photo). */
  plate: { reveal: "fade", parallax: 0.06, once: true },
  /** Stock photo plate in a grid/card. */
  "plate-stock": { reveal: "rise", parallax: 0.14, once: true },
  /** Full-bleed hero / scrim plate — drama. */
  "plate-hero": { reveal: "blur-rise", parallax: 0.2, once: true },
  /** Page sections. */
  section: { reveal: "rise", parallax: 0.08, once: true },
  default: { reveal: "rise", parallax: 0.1, once: true },
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
