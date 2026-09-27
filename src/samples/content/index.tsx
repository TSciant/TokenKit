"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { BrandContent, Pages } from "./types";
import { DOOR_SHOP } from "./door-shop";
import { MOHAVE } from "./mohave";
import { BATHING_BAGELS } from "./bathing-bagels";
import { WANDAS } from "./wandas";
import { MUNCHEESE } from "./muncheese";
import { TK } from "./tk";

/**
 * Which brand's words are in force.
 *
 * NOT read from the DOM. `data-brand` is a CSS coordinate and the cascade
 * resolves it per element, which is exactly right for tokens and no use at all
 * to React — a component cannot ask "which brand am I inside" without reading
 * a computed style, and a component that reads computed styles to decide what
 * to render is a component that renders differently on the second frame.
 *
 * So the brand arrives as context, set by whatever already knows: the
 * Storybook decorator from the toolbar global, the Next.js layout from the
 * route. The two mechanisms run in parallel on the same value, which is why
 * .storybook/preview.tsx sets `data-brand` and this provider from one
 * variable.
 */
const PACKS: Record<string, BrandContent> = Object.fromEntries(
  [DOOR_SHOP, MOHAVE, BATHING_BAGELS, WANDAS, MUNCHEESE, TK].map((b) => [b.slug, b]),
);

const EMPTY: Pages = {};

const ContentContext = createContext<BrandContent | null>(null);

export function ContentProvider({
  brand,
  children,
}: {
  /** A pack slug. Anything unknown — including the wireframe packs — is the
      absence of a content pack, which is the correct state for them: the
      delivered prototype is unbranded and its copy is the ipsum. */
  brand?: string;
  children: ReactNode;
}) {
  const value = useMemo(() => (brand ? (PACKS[brand] ?? null) : null), [brand]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

/**
 * The pages of the brand in force, or an empty object.
 *
 * Empty is not a failure mode and needs no handling: every pattern prop is
 * optional and defaults to ipsum, so `<ProofStrip {...(c.proof ?? {})} />`
 * with nothing in it is `<ProofStrip />`. The fallback is the absence of a
 * value rather than a branch, which is why no page below has an `if`.
 */
export function useContent(): Pages {
  return useContext(ContentContext)?.pages ?? EMPTY;
}

/** The whole pack — label, nav, spine. Null when no brand is in force. */
export function useBrandContent(): BrandContent | null {
  return useContext(ContentContext);
}

export { PACKS };
export type { BrandContent, Pages } from "./types";
