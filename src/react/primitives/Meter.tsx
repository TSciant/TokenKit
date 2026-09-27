import type { CSSProperties } from "react";

export interface MeterProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  /** Rendered beside the label. Defaults to "<value> / <max>". */
  display?: string;
}

/**
 * Meter. The value is exposed three ways: as text, as ARIA state, and as
 * width. Width alone communicates nothing to a screen reader and nothing to
 * anyone who cannot compare two bars.
 */
export function Meter({ label, value, min = 0, max = 100, display }: MeterProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div data-tk="meter">
      <div data-tk="meter-head">
        <span>{label}</span>
        <span>{display ?? `${value} / ${max}`}</span>
      </div>
      <div
        data-tk="meter-track"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      >
        <div
          data-tk="meter-fill"
          style={{ "--tk-meter-value": pct } as CSSProperties}
        />
      </div>
    </div>
  );
}
