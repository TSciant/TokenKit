"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "./Icon";
import { FieldError, RequiredMark } from "./field-parts";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Other words it is found by: an abbreviation, an old name ("DC"). */
  keywords?: string[];
  /** A short second line (a code, a count). Not interactive. */
  meta?: string;
  disabled?: boolean;
};

export interface ComboboxProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  /** The input's id, for an ErrorSummary link. */
  id?: string;
  /** Submitted with the form: the chosen option's value (or the typed text, with allowCustom). */
  name?: string;
  chars?: 10 | 20 | 30;
  disabled?: boolean;
  /** More than 15 of them; fewer is a select (Field control="select"). */
  options: ComboboxOption[];
  /** The chosen option's value. Changes only on Enter or a click, never on the arrow keys. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** The typed text, when the page needs to control it (a search that fetches). */
  inputValue?: string;
  onInputChange?: (text: string) => void;
  /** Free text is a value too (a search), rather than only the options. */
  allowCustom?: boolean;
  /** select: a chevron at the end. search: a magnifier at the start, no chevron. */
  kind?: "select" | "search";
  /** Open on focus, for a short list of recent items. Off by default: a list on every Tab is noise. */
  openOnFocus?: boolean;
  /** Which options the text finds. Case-insensitive "contains" on the label and keywords by default. */
  filter?: (option: ComboboxOption, text: string) => boolean;
  emptyText?: string;
  /** The options are on their way (a fetch). */
  loading?: boolean;
}

const contains = (o: ComboboxOption, q: string) => {
  const t = q.toLowerCase();
  return o.label.toLowerCase().includes(t) || (o.keywords ?? []).some((k) => k.toLowerCase().includes(t));
};

/* The matched part, marked. */
function mark(label: string, q: string): ReactNode {
  const i = q ? label.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return label;
  return <>{label.slice(0, i)}<mark data-tk="combobox-match">{label.slice(i, i + q.length)}</mark>{label.slice(i + q.length)}</>;
}

/**
 * Combobox — type to narrow a long list, then choose.
 *
 * An editable combobox with a listbox (the APG pattern, list autocomplete,
 * chosen by hand). Focus stays in the text box the whole time; the arrow
 * keys move a highlight through the options (aria-activedescendant), Enter
 * or a click chooses, Escape closes and then clears. Typing never replaces
 * what was typed. The number of matches is said when typing pauses. Without
 * allowCustom, leaving with text that is not an option puts back the last
 * choice, and leaving it empty clears the choice. No placeholder: the label and hint say what to type.
 */
export function Combobox({
  label,
  hint,
  error,
  required,
  optional,
  id: idProp,
  name,
  chars,
  disabled,
  options,
  value: valueProp,
  defaultValue = null,
  onChange,
  inputValue,
  onInputChange,
  allowCustom = false,
  kind = "select",
  openOnFocus = false,
  filter = contains,
  emptyText = "No matches",
  loading = false,
}: ComboboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-list`;
  /* By the option's place in the whole list, not in the filtered one: an id keeps naming the same option as the list narrows. */
  const optId = (o: ComboboxOption | undefined) => `${id}-opt-${o ? options.indexOf(o) : -1}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const [valueState, setValueState] = useState<string | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : valueState;
  const chosen = options.find((o) => o.value === value) ?? null;
  const [textState, setTextState] = useState(chosen?.label ?? (allowCustom && value ? value : ""));
  const text = inputValue ?? textState;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const setText = (t: string) => { if (inputValue === undefined) setTextState(t); onInputChange?.(t); };
  const commit = (v: string | null) => { if (valueProp === undefined) setValueState(v); onChange?.(v); };

  /* All of them while the text is the chosen option's own label; the matches otherwise. */
  const query = chosen && text === chosen.label ? "" : text.trim();
  const shown = useMemo(() => (query ? options.filter((o) => filter(o, query)) : options), [options, query, filter]);
  const enabled = (i: number) => i >= 0 && i < shown.length && !shown[i].disabled;
  const step = (from: number, dir: 1 | -1) => { for (let i = from + dir; i >= 0 && i < shown.length; i += dir) if (enabled(i)) return i; return -1; };

  /* Follow the highlight. */
  useEffect(() => { if (open && active >= 0) document.getElementById(optId(shown[active]))?.scrollIntoView({ block: "nearest" }); }, [open, active]);

  /* Say how many match once typing pauses, only while the list is open. */
  useEffect(() => {
    if (!open) { setSaid(""); return; }
    const t = setTimeout(() => setSaid(loading ? "Loading" : shown.length ? `${shown.length} ${shown.length === 1 ? "result" : "results"} available` : emptyText), 800);
    return () => clearTimeout(t);
  }, [open, shown.length, loading, emptyText]);

  const choose = (o: ComboboxOption) => {
    if (o.disabled) return;
    commit(o.value);
    setText(o.label);
    setOpen(false);
    setActive(-1);
    requestAnimationFrame(() => { const el = input.current; if (el) el.setSelectionRange(el.value.length, el.value.length); });
  };

  const close = () => { setOpen(false); setActive(-1); };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (e.altKey) { setOpen(true); return; }
        if (!open) { setOpen(true); setActive(step(-1, 1)); return; }
        setActive(active < 0 ? step(-1, 1) : step(active, 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey) { close(); return; }
        if (!open) { setOpen(true); setActive(step(shown.length, -1)); return; }
        setActive(active < 0 ? step(shown.length, -1) : step(active, -1));
        return;
      case "Enter":
        if (open && enabled(active)) { e.preventDefault(); choose(shown[active]); return; }
        if (open) e.preventDefault();
        if (allowCustom) { commit(text.trim() || null); close(); }
        return;
      case "Escape":
        if (open) { e.preventDefault(); close(); return; }
        if (text) { e.preventDefault(); setText(""); commit(null); }
        return;
      case "Home":
      case "End":
      case "ArrowLeft":
      case "ArrowRight":
        setActive(-1);
        return;
      case "Tab":
        close();
        return;
    }
  };

  /* Leaving: free text is kept with allowCustom; emptied, the choice is cleared; otherwise the last choice comes back. */
  const onBlur = () => {
    close();
    if (allowCustom) { if ((text.trim() || null) !== value) commit(text.trim() || null); return; }
    if (!text.trim() && value !== null) { commit(null); return; }
    setText(chosen?.label ?? "");
  };

  const expanded = open && !disabled;

  return (
    <div data-tk="field">
      <label data-tk="field-label" htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : optional ? <span data-tk="field-optional"> (optional)</span> : null}
      </label>
      {hint ? <p data-tk="field-hint" id={hintId}>{hint}</p> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      <div data-tk="combobox" data-kind={kind} data-chars={chars} data-open={expanded ? "" : undefined}>
        {kind === "search" ? <span data-tk="combobox-lead"><Icon name="search" size="sm" /></span> : null}
        <input
          ref={input}
          data-tk="input"
          id={id}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && active >= 0 ? optId(shown[active]) : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={text}
          onChange={(e) => { setText(e.currentTarget.value); setOpen(true); setActive(-1); }}
          onKeyDown={onKeyDown}
          onFocus={() => { if (openOnFocus) setOpen(true); }}
          onBlur={onBlur}
          onClick={() => { if (openOnFocus && !open) setOpen(true); }}
        />
        {kind === "select" ? (
          <button
            type="button"
            data-tk="combobox-toggle"
            tabIndex={-1}
            aria-label={`${expanded ? "Hide" : "Show"} options for ${label}`}
            aria-controls={listId}
            aria-expanded={expanded}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { input.current?.focus(); if (expanded) close(); else { setOpen(true); setActive(-1); } }}
          >
            <Icon name="chevronDown" size="sm" />
          </button>
        ) : null}
        <div data-tk="combobox-popup" hidden={!expanded}>
          <ul data-tk="combobox-list" role="listbox" id={listId} aria-label={label} ref={list}>
            {shown.map((o, i) => (
              <li
                key={o.value}
                id={optId(o)}
                role="option"
                data-tk="combobox-option"
                /* Selected is the highlighted option, the one aria-activedescendant names (the APG list
                   autocomplete); the chosen one is marked by its tick and its weight. */
                aria-selected={i === active}
                data-chosen={o.value === value ? "" : undefined}
                aria-disabled={o.disabled || undefined}
                data-active={i === active ? "" : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                onMouseMove={() => { if (i !== active && !o.disabled) setActive(i); }}
              >
                <span data-tk="combobox-option-text">
                  <span>{mark(o.label, query)}</span>
                  {o.meta ? <span data-tk="combobox-option-meta">{o.meta}</span> : null}
                </span>
                {o.value === value ? <Icon name="check" size="sm" /> : null}
              </li>
            ))}
          </ul>
          {!shown.length ? <p data-tk="combobox-empty">{loading ? "Loading…" : emptyText}</p> : null}
        </div>
      </div>
      {name ? <input type="hidden" name={name} value={allowCustom ? (value ?? text) : value ?? ""} /> : null}
      <span data-tk="visually-hidden" role="status">{said}</span>
    </div>
  );
}
