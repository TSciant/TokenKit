import type { CSSProperties } from "react";

export interface MeterProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  /**
   * Rendered beside the label, and what a screen reader says for the value
   * (aria-valuetext). Defaults to "<value> of <max>".
   */
  display?: string;
}

/**
 * Meter. The value is exposed three ways: as text, as ARIA state, and as
 * width. Width alone communicates nothing to a screen reader and nothing to
 * anyone who cannot compare two bars.
 *
 * A screen reader hears it once, from the meter itself: "Places taken,
 * meter, 6 of 8". The visible head repeats the same words, so it is hidden
 * from assistive tech; the meter carries the label and says the value in the
 * same words the head shows (aria-valuetext), not a bare "6" or "75%".
 */
export function Meter({ label, value, min = 0, max = 100, display }: MeterProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const said = display ?? `${value} of ${max}`;
  return (
    <div data-tk="meter">
      <div data-tk="meter-head" aria-hidden="true">
        <span>{label}</span>
        <span>{said}</span>
      </div>
      <div
        data-tk="meter-track"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={said}
      >
        <div
          data-tk="meter-fill"
          style={{ "--tk-meter-value": pct } as CSSProperties}
        />
      </div>
    </div>
  );
}
