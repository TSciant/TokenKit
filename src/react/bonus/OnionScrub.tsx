import { useState, useCallback, type ReactNode } from "react";

export interface OnionValue {
  label: string;
  meant: string | number;
  got: string | number;
  unit?: string;
}

export interface OnionScrubProps {
  values: OnionValue[];
  onAlign?: (label: string) => void;
  onAccept?: (label: string) => void;
  onPause?: () => void;
  onReplace?: (label: string) => void;
  children?: ReactNode;
}

/**
 * OnionScrub — Meant|Got comparison plate for design-code alignment.
 * 
 * Shows intended vs actual values with verb controls (Align/Accept/Pause/Replace).
 * This is craft-chamber onion for component alignment, NOT the Figma↔live
 * onionskin tooling.
 * 
 * @example
 * ```tsx
 * <OnionScrub
 *   values={[
 *     { label: "padding", meant: "16px", got: "12px" },
 *     { label: "color", meant: "#FF0000", got: "#FF1A1A" },
 *   ]}
 *   onAlign={(label) => console.log("Align", label)}
 *   onAccept={(label) => console.log("Accept", label)}
 * />
 * ```
 */
export function OnionScrub({
  values,
  onAlign,
  onAccept,
  onPause,
  onReplace,
  children,
}: OnionScrubProps) {
  const [pausedState, setPausedState] = useState(false);
  const [activeVerb, setActiveVerb] = useState<string | null>(null);

  const handleAlign = useCallback(
    (label: string) => {
      setActiveVerb("align");
      onAlign?.(label);
      setTimeout(() => setActiveVerb(null), 300);
    },
    [onAlign]
  );

  const handleAccept = useCallback(
    (label: string) => {
      setActiveVerb("accept");
      onAccept?.(label);
      setTimeout(() => setActiveVerb(null), 300);
    },
    [onAccept]
  );

  const handlePause = useCallback(() => {
    setPausedState(!pausedState);
    setActiveVerb("pause");
    onPause?.();
    setTimeout(() => setActiveVerb(null), 300);
  }, [pausedState, onPause]);

  const handleReplace = useCallback(
    (label: string) => {
      setActiveVerb("replace");
      onReplace?.(label);
      setTimeout(() => setActiveVerb(null), 300);
    },
    [onReplace]
  );

  const hasMisalignment = values.some((v) => v.meant !== v.got);
  const state = pausedState ? "paused" : hasMisalignment ? "misaligned" : "aligned";

  return (
    <div data-onion="scrub" data-onion-state={state}>
      {values.map((value) => {
        const isDifferent = value.meant !== value.got;
        return (
          <div key={value.label}>
            <div data-onion-plate>
              <span data-onion-label>Meant</span>
              <span data-onion-value="meant">
                {value.meant}
                {value.unit}
              </span>
              <span data-onion-label>Got</span>
              <span data-onion-value="got">
                {value.got}
                {value.unit}
              </span>
            </div>
            {isDifferent && (
              <div data-onion-delta>
                Δ {value.label}: {typeof value.meant === "number" && typeof value.got === "number"
                  ? Math.abs(value.meant - value.got)
                  : "mismatch"}
                {value.unit}
              </div>
            )}
          </div>
        );
      })}

      <div data-onion-verbs>
        <button
          data-onion-verb="align"
          aria-pressed={activeVerb === "align"}
          onClick={() => values.forEach((v) => v.meant !== v.got && handleAlign(v.label))}
          disabled={!hasMisalignment}
        >
          Align
        </button>
        <button
          data-onion-verb="accept"
          aria-pressed={activeVerb === "accept"}
          onClick={() => values.forEach((v) => v.meant !== v.got && handleAccept(v.label))}
          disabled={!hasMisalignment}
        >
          Accept
        </button>
        <button
          data-onion-verb="pause"
          aria-pressed={activeVerb === "pause" || pausedState}
          onClick={handlePause}
        >
          {pausedState ? "Resume" : "Pause"}
        </button>
        <button
          data-onion-verb="replace"
          aria-pressed={activeVerb === "replace"}
          onClick={() => values.forEach((v) => v.meant !== v.got && handleReplace(v.label))}
          disabled={!hasMisalignment}
        >
          Replace
        </button>
      </div>

      {children}
    </div>
  );
}
