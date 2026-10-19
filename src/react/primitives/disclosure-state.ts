"use client";
/* Client module: a hook that keeps state. */

import { useState } from "react";

/**
 * Which sections of a list are open: one engine for Accordion and Faq, which
 * used to keep the same set of indexes twice. A section opens and closes on
 * its own; with `single`, opening one closes the others (and on first paint
 * only the first `defaultOpen` wins).
 */
export function useOpenSet(items: { defaultOpen?: boolean }[], single = false) {
  const [open, setOpen] = useState<Set<number>>(() => {
    const first = items.flatMap((it, i) => (it.defaultOpen ? [i] : []));
    return new Set(single ? first.slice(0, 1) : first);
  });
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(single ? [] : prev);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return [open, toggle] as const;
}
