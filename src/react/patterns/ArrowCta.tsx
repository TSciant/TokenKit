import { Arrow } from "../primitives/Arrow";
import { ipsumLabel } from "../../lib/token-ipsum";

/* ---------------------------------------------------------------------------
   06 — the arrow call to action, on its own so a client cut can take it (and
   the patterns built on it) without the homepage modules around it.
   marketing.tsx re-exports it.
--------------------------------------------------------------------------- */

export const ARROW_CTA_LABEL = ipsumLabel("arrow-cta-label");

/** 06 — the repeated conversion pattern. Uppercase label, trailing arrow. */
export function ArrowCta({
  children = ARROW_CTA_LABEL,
  variant,
  size = "lg",
}: {
  children?: React.ReactNode;
  variant?: "solid" | "outline" | "quiet";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      data-tk="button"
      data-arrow-cta=""
      data-variant={variant}
      data-size={size}
      type="button"
      style={{
        textTransform: "uppercase",
        letterSpacing: "var(--tk-tracking-wide)",
        fontWeight: "var(--tk-weight-semibold)",
      }}
    >
      {children}
      <Arrow />
    </button>
  );
}
