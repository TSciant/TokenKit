import type { HTMLAttributes, ReactNode } from "react";

export type EyebrowProps = HTMLAttributes<HTMLSpanElement> & {
  emphasis?: "quiet";
  children?: ReactNode;
};

/** Small uppercase label above a headline; optional leading icon as child. */
export function Eyebrow({ emphasis, children, ...rest }: EyebrowProps) {
  return (
    <span data-tk="eyebrow" data-emphasis={emphasis} {...rest}>
      {children}
    </span>
  );
}
