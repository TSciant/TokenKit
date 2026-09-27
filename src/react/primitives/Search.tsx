"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, useState, type FormEvent } from "react";
import { Icon } from "./Icon";

export type SearchProps = {
  /** Controlled open state; omit for internal state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  label?: string;
  onSubmit?: (value: string) => void;
};

/**
 * Header search that does not swap the DOM — input always mounted, collapses
 * to zero inline size when closed (`inert` when collapsed).
 */
export function Search({
  open: openProp,
  onOpenChange,
  placeholder = "Search",
  label = "Search",
  onSubmit,
}: SearchProps) {
  const id = useId();
  const [internal, setInternal] = useState(false);
  const open = openProp ?? internal;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (openProp === undefined) setInternal(v);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const q = String(fd.get("q") ?? "");
    onSubmit?.(q);
  };

  return (
    <form data-tk="search" data-open={open ? "" : undefined} onSubmit={submit} role="search">
      <label data-tk="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        data-tk="input"
        name="q"
        type="search"
        placeholder={placeholder}
        inert={open ? undefined : true}
      />
      <button
        type={open ? "submit" : "button"}
        data-tk="button"
        data-variant="quiet"
        data-size="sm"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open) setOpen(true);
        }}
      >
        <Icon name="search" size="sm" />
        <span data-tk="visually-hidden">{open ? "Submit search" : "Open search"}</span>
      </button>
      {open ? (
        <button
          type="button"
          data-tk="button"
          data-variant="quiet"
          data-size="sm"
          onClick={() => setOpen(false)}
        >
          <Icon name="close" size="sm" />
          <span data-tk="visually-hidden">Close search</span>
        </button>
      ) : null}
    </form>
  );
}
