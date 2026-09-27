import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

type ChipBase = {
  emphasis?: "default" | "strong" | "quiet";
  /** Makes the chip a control (24px target). Prefer with pressed for filters. */
  interactive?: boolean;
  /** Toggle / filter selected state. Progressive: absent = plain label. */
  pressed?: boolean;
  /** Leading mark — prefer a small Icon. */
  leading?: ReactNode;
  children?: ReactNode;
};

export type ChipProps = ChipBase &
  (
    | ({ interactive: true } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ interactive?: false | undefined } & HTMLAttributes<HTMLSpanElement>)
  );

/**
 * Chip. Baseline is a non-interactive label. Progressive layers:
 * interactive → real button; pressed → aria-pressed; leading → icon/mark.
 */
export function Chip({
  emphasis,
  interactive,
  pressed,
  leading,
  children,
  ...rest
}: ChipProps) {
  const common = {
    "data-tk": "chip",
    "data-emphasis": emphasis === "default" ? undefined : emphasis,
    "data-interactive": interactive ? "" : undefined,
    "data-pressed": pressed ? "" : undefined,
    "data-leading": leading ? "" : undefined,
  } as const;

  const body = (
    <>
      {leading ? <span data-tk="chip-leading">{leading}</span> : null}
      <span data-tk="chip-label">{children}</span>
    </>
  );

  if (interactive) {
    const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        type="button"
        {...common}
        aria-pressed={pressed ?? false}
        {...buttonRest}
      >
        {body}
      </button>
    );
  }

  return (
    <span {...common} {...(rest as HTMLAttributes<HTMLSpanElement>)}>
      {body}
    </span>
  );
}
