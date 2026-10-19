"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export type ReorderItem = { id: string; label: string; content?: ReactNode };

export type ReorderMessages = {
  instructions: string;
  pickedUp: (label: string, pos: number, of: number) => string;
  moved: (label: string, pos: number, of: number) => string;
  dropped: (label: string, pos: number, of: number) => string;
  cancelled: (label: string, pos: number, of: number) => string;
  moveUp: string;
  moveDown: string;
  grip: (label: string) => string;
};

const MESSAGES: ReorderMessages = {
  instructions: "Press Space or Enter to pick it up. Use the up and down arrows to move it, Space or Enter to put it down, Escape to cancel.",
  pickedUp: (l, p, n) => `Picked up ${l}, position ${p} of ${n}.`,
  moved: (l, p, n) => `${l}, moved to position ${p} of ${n}.`,
  dropped: (l, p, n) => `${l} dropped at position ${p} of ${n}.`,
  cancelled: (l, p, n) => `Move cancelled. ${l} back at position ${p} of ${n}.`,
  moveUp: "Move up",
  moveDown: "Move down",
  grip: (l) => `Reorder ${l}`,
};

export interface ReorderListProps {
  /** The list's name: "Team order". */
  label: string;
  items: ReorderItem[];
  /** The new order, and the move that made it. */
  onReorder: (ids: string[], move: { id: string; from: number; to: number }) => void;
  /** No reordering (the list is sorted by something). Say why in disabledReason. */
  disabled?: boolean;
  disabledReason?: ReactNode;
  /** The words, for another language. */
  messages?: Partial<ReorderMessages>;
}

const moveTo = <T,>(list: T[], from: number, to: number) => { const next = list.slice(); const [x] = next.splice(from, 1); next.splice(to, 0, x); return next; };

/**
 * ReorderList — put a short list in order by dragging, by keyboard, or with
 * a button.
 *
 * Each item has a grip to drag it by, which is also a button: Space or Enter
 * picks the item up, the arrows move it, Space or Enter puts it down, Escape
 * puts it back. Each item also has Move up and Move down, so a single tap
 * does it without dragging (WCAG 2.5.7). Every pick-up, move, drop and cancel
 * is said, with the position. For quick reordering of a short list; not when
 * the list is sorted by something (disable it and say so).
 */
export function ReorderList({ label, items, onReorder, disabled, disabledReason, messages }: ReorderListProps) {
  const m = { ...MESSAGES, ...messages };
  const id = useId();
  const [grabbed, setGrabbed] = useState<{ id: string; from: number } | null>(null);
  const [preview, setPreview] = useState<ReorderItem[] | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [said, setSaid] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const shown = preview ?? items;
  const n = items.length;

  const focusGrip = (itemId: string) => requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>(`[data-grip="${CSS.escape(itemId)}"]`)?.focus());
  const commit = (itemId: string, from: number, to: number, list: ReorderItem[]) => { if (from !== to) onReorder(list.map((x) => x.id), { id: itemId, from, to }); };

  const onGripKey = (e: KeyboardEvent<HTMLButtonElement>, item: ReorderItem, index: number) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!grabbed) { setGrabbed({ id: item.id, from: index }); setPreview(items); setSaid(m.pickedUp(item.label, index + 1, n)); return; }
      const to = shown.findIndex((x) => x.id === grabbed.id);
      commit(grabbed.id, grabbed.from, to, shown);
      setSaid(m.dropped(item.label, to + 1, n));
      setGrabbed(null); setPreview(null);
      return;
    }
    if (!grabbed) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const at = shown.findIndex((x) => x.id === grabbed.id);
      const to = e.key === "ArrowUp" ? Math.max(0, at - 1) : Math.min(n - 1, at + 1);
      if (to === at) return;
      setPreview(moveTo(shown, at, to));
      setSaid(m.moved(item.label, to + 1, n));
      focusGrip(item.id);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setSaid(m.cancelled(item.label, grabbed.from + 1, n));
      setGrabbed(null); setPreview(null);
      focusGrip(item.id);
    }
  };

  /* Leaving the grip while carrying puts the item down where it is. */
  const onGripBlur = (item: ReorderItem) => {
    if (!grabbed || grabbed.id !== item.id) return;
    requestAnimationFrame(() => {
      if (listRef.current?.querySelector(`[data-grip="${CSS.escape(item.id)}"]`) === document.activeElement) return;
      const to = shown.findIndex((x) => x.id === grabbed.id);
      commit(grabbed.id, grabbed.from, to, shown);
      setSaid(m.dropped(item.label, to + 1, n));
      setGrabbed(null); setPreview(null);
    });
  };

  const byButton = (item: ReorderItem, index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (disabled || to < 0 || to >= n) return;
    const next = moveTo(items, index, to);
    commit(item.id, index, to, next);
    setSaid(m.moved(item.label, to + 1, n));
  };

  /* Dragging with a pointer, by the grip. */
  const drag = useRef<{ id: string; from: number } | null>(null);
  const onDragStart = (e: DragEvent, item: ReorderItem, index: number) => { drag.current = { id: item.id, from: index }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", item.label); setSaid(m.pickedUp(item.label, index + 1, n)); };
  const onDragOver = (e: DragEvent, index: number) => { if (!drag.current) return; e.preventDefault(); setDragOver(index); };
  const onDrop = (e: DragEvent, index: number) => {
    e.preventDefault();
    const d = drag.current; drag.current = null; setDragOver(null);
    if (!d) return;
    const next = moveTo(items, d.from, index);
    commit(d.id, d.from, index, next);
    setSaid(m.dropped(items[d.from].label, index + 1, n));
  };

  return (
    <div data-tk="reorder" data-disabled={disabled ? "" : undefined}>
      {disabled && disabledReason ? <p data-tk="field-hint" id={`${id}-reason`}>{disabledReason}</p> : null}
      <p data-tk="visually-hidden" id={`${id}-how`}>{m.instructions}</p>
      <ol data-tk="reorder-list" aria-label={label} ref={listRef}>
        {shown.map((item, i) => (
          <li
            key={item.id}
            data-tk="reorder-item"
            data-grabbed={grabbed?.id === item.id ? "" : undefined}
            data-over={dragOver === i ? "" : undefined}
            onDragOver={(e) => onDragOver(e, i)}
            onDragLeave={() => setDragOver((o) => (o === i ? null : o))}
            onDrop={(e) => onDrop(e, i)}
          >
            <button
              type="button"
              data-tk="reorder-grip"
              data-grip={item.id}
              draggable={!disabled}
              aria-label={m.grip(item.label)}
              aria-describedby={disabled && disabledReason ? `${id}-reason` : `${id}-how`}
              aria-pressed={grabbed?.id === item.id}
              aria-disabled={disabled || undefined}
              onKeyDown={(e) => onGripKey(e, item, i)}
              onBlur={() => onGripBlur(item)}
              onDragStart={(e) => onDragStart(e, item, i)}
              onDragEnd={() => { drag.current = null; setDragOver(null); }}
            >
              <Icon name="grip" size="sm" />
            </button>
            <span data-tk="reorder-label">{item.content ?? item.label}</span>
            <span data-tk="reorder-moves">
              <Button type="button" variant="quiet" size="sm" disabled={disabled || i === 0} onClick={() => byButton(item, i, -1)}>
                <Icon name="arrowUp" size="sm" /><span data-tk="visually-hidden">{m.moveUp}: {item.label}</span>
              </Button>
              <Button type="button" variant="quiet" size="sm" disabled={disabled || i === n - 1} onClick={() => byButton(item, i, 1)}>
                <Icon name="arrowDown" size="sm" /><span data-tk="visually-hidden">{m.moveDown}: {item.label}</span>
              </Button>
            </span>
          </li>
        ))}
      </ol>
      <span data-tk="visually-hidden" role="status">{said}</span>
    </div>
  );
}
