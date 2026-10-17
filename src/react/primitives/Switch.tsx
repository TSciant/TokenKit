import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "children"> {
  /** What it turns on and off ("Email me when someone replies"). */
  label: ReactNode;
  /** A line under the label: what on means. */
  hint?: ReactNode;
  /** Words for its state, shown beside the track ("On", "Off"). Left out, the state is in the track alone (and read out by the switch role). */
  stateLabels?: [on: string, off: string];
}

/**
 * Switch — a setting that is on or off and takes effect at once.
 *
 * Use for: a preference that changes something straight away, with no save
 * button (notifications, a dark theme). Don't use for: a choice that is only
 * sent with a form (a checkbox, in a ChoiceGroup), or more than two states.
 *
 * A native checkbox with the switch role, so it is reached by Tab, flipped
 * by Space, and read as "on" or "off"; the label is a real label, so the
 * whole row is the target. The track's edge is the strong line (3:1 on every
 * surface), and on fills it with the action colour, so the state is never
 * only a colour: the thumb moves too.
 */
export function Switch({ label, hint, stateLabels, id: idIn, disabled, className, style, ...rest }: SwitchProps) {
  const auto = useId();
  const id = idIn ?? auto;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <label data-tk="switch" htmlFor={id} className={className} style={style}>
      <span data-tk="switch-text">
        <span data-tk="switch-label">{label}</span>
        {hint ? (
          <span data-tk="switch-hint" id={hintId}>
            {hint}
          </span>
        ) : null}
      </span>
      <span data-tk="switch-control">
        <input data-tk="switch-input" id={id} type="checkbox" role="switch" aria-describedby={hintId} disabled={disabled} {...rest} />
        <span data-tk="switch-track" aria-hidden="true">
          <span data-tk="switch-thumb" />
        </span>
        {stateLabels ? (
          <span data-tk="switch-state" aria-hidden="true">
            <span data-tk="switch-on">{stateLabels[0]}</span>
            <span data-tk="switch-off">{stateLabels[1]}</span>
          </span>
        ) : null}
      </span>
    </label>
  );
}
