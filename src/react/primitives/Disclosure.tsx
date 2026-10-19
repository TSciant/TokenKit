import type { HTMLAttributes, ReactNode } from "react";

export type DisclosureProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

/**
 * Opt-in entrance panel (`data-tk="disclosure"`). Uses @starting-style so insert
 * animates without a second render. Pair with FAQ or any reveal stack.
 */
export function Disclosure({ children, ...rest }: DisclosureProps) {
  return (
    <div data-tk="disclosure" {...rest}>
      {children}
    </div>
  );
}
