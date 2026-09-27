import type { AnchorHTMLAttributes } from "react";

export type SkipLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string;
};

/** Skip to main content — hidden until focused. Page chrome outside the concentric chain. */
export function SkipLink({
  href = "#main",
  children = "Skip to main content",
  ...rest
}: SkipLinkProps) {
  return (
    <a data-tk="skip-link" href={href} {...rest}>
      {children}
    </a>
  );
}
