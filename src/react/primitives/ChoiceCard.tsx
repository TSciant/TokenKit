import { useId } from "react";
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export type ChoiceCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "title"> & {
  /** radio: one of a set (share a `name`). checkbox: any number. */
  type?: "radio" | "checkbox";
  /** The option's name. This is the control's label. */
  title: ReactNode;
  /** A line or two under the title, read as the control's description. */
  description?: ReactNode;
  /** A short fact at the end of the title line: a price, a count, "Recommended". */
  meta?: ReactNode;
};

/**
 * Choice card — a radio or checkbox drawn as a card.
 *
 * For choosing between a few options that each need a sentence (plans,
 * delivery speeds, a setup path). PatternFly calls these selectable cards and
 * tiles; this one is built on the native input rather than imitating one, so
 * the group, the arrow keys between radios, Space to toggle, required, form
 * submission and the screen-reader announcement ("radio button, 2 of 3,
 * checked") are all the browser's. The whole card is the label, so the whole
 * card is the target. The native control stays visible: the dot or tick says
 * "selected" without relying on the border's colour.
 */
export function ChoiceCard({ type = "radio", title, description, meta, id, ...rest }: ChoiceCardProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const descId = description ? `${inputId}-desc` : undefined;
  /* The label wraps the whole card (so the whole card is the target), which
     would make every word on it the control's NAME, description included,
     and a screen reader would then read the description twice. Name it by
     the title and meta; the description is the description. */
  const nameIds = [`${inputId}-title`, meta ? `${inputId}-meta` : undefined].filter(Boolean).join(" ");
  return (
    <label data-tk="choice-card" htmlFor={inputId}>
      <input data-tk="choice-card-input" id={inputId} type={type} aria-labelledby={nameIds} aria-describedby={descId} {...rest} />
      <span data-tk="choice-card-text">
        <span data-tk="choice-card-head">
          <span data-tk="choice-card-title" id={`${inputId}-title`}>{title}</span>
          {meta ? <span data-tk="choice-card-meta" id={`${inputId}-meta`}>{meta}</span> : null}
        </span>
        {description ? (
          <span data-tk="choice-card-description" id={descId}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export type ChoiceCardOption = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
};

export type ChoiceCardGroupProps = Omit<HTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue"> & {
  /** The question the cards answer. Rendered as the fieldset's legend. */
  legend: ReactNode;
  /** Visually hide the legend (it is still the group's name). */
  hideLegend?: boolean;
  /** The form field name every card shares. */
  name: string;
  type?: "radio" | "checkbox";
  options: ChoiceCardOption[];
  /** Uncontrolled initial selection: a value for radios, values for checkboxes. */
  defaultValue?: string | string[];
  /** Controlled selection. */
  value?: string | string[];
  onChange?: (value: string, checked: boolean) => void;
  required?: boolean;
  /** Column target for the grid shell; it still collapses by width. */
  columns?: 1 | 2 | 3 | 4;
  hint?: ReactNode;
};

/**
 * A fieldset of choice cards: the legend is the question, the cards are the
 * answers, laid out on the grid shell.
 */
export function ChoiceCardGroup({
  legend,
  hideLegend,
  name,
  type = "radio",
  options,
  defaultValue,
  value,
  onChange,
  required,
  columns = 3,
  hint,
  ...rest
}: ChoiceCardGroupProps) {
  const has = (set: string | string[] | undefined, v: string) =>
    set === undefined ? undefined : Array.isArray(set) ? set.includes(v) : set === v;
  const hintId = useId();
  return (
    <fieldset {...rest} data-tk="choice-card-group" aria-describedby={hint ? hintId : undefined}>
      <legend data-tk={hideLegend ? "visually-hidden" : "choice-card-legend"}>{legend}</legend>
      {hint ? (
        <p data-tk="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div data-shell="grid" data-cols={String(columns)} data-gap="3">
        {options.map((o, i) => (
          <ChoiceCard
            key={o.value}
            type={type}
            name={name}
            value={o.value}
            title={o.title}
            description={o.description}
            meta={o.meta}
            disabled={o.disabled}
            required={required && type === "radio" && i === 0 ? true : undefined}
            checked={has(value, o.value)}
            defaultChecked={value === undefined ? has(defaultValue, o.value) : undefined}
            onChange={onChange ? (e) => onChange(o.value, e.currentTarget.checked) : undefined}
            readOnly={value !== undefined && !onChange ? true : undefined}
          />
        ))}
      </div>
    </fieldset>
  );
}
