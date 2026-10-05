import { useEffect, useId, useRef, useState, type HTMLAttributes } from "react";

export type MenuButtonItem = {
  label: string;
  /** A link. Without one the item is a button and calls `onSelect`. */
  href?: string;
  onSelect?: () => void;
  /** The page you are on, when the list is navigation. */
  current?: boolean;
};

export type MenuButtonProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  /** The trigger's text. */
  label?: string;
  items: MenuButtonItem[];
  /** Which edge of the trigger the list lines up with. */
  // tk-vocab: align omits center, stretch — a list hangs from one edge of its trigger; those values belong to the shells' data-align
  align?: "start" | "end";
  variant?: "solid" | "outline" | "quiet";
  /**
   * The trigger's size, as Button's. Small by default, which is where a More
   * usually sits (a card corner, a toolbar); match the buttons beside it when
   * it is one of a row.
   */
  size?: "sm" | "md" | "lg";
  /** Open on first render, so the list can be looked at without a click. */
  initialOpen?: boolean;
};

/**
 * A button that opens a short list of links or actions. Use for: a handful of
 * related destinations or actions behind one control (More, Share, Account),
 * where a mega menu would be a whole panel for six links. Don't use for:
 * the site's primary navigation, a long or grouped list (use a mega menu or a
 * rail nav), or choosing a value (that is a select). It is the disclosure
 * pattern, not role="menu": the trigger has aria-expanded, the items are
 * ordinary links and buttons, and Tab moves through them as everywhere else.
 * Escape and a click outside close it; the arrow keys move between items.
 */
export function MenuButton({
  label = "More",
  items,
  align = "start",
  variant = "outline",
  size = "sm",
  initialOpen = false,
  ...rest
}: MenuButtonProps) {
  const [open, setOpen] = useState(initialOpen);
  const wrap = useRef<HTMLDivElement>(null);
  const panelId = useId();

  /* Subscribed on open and torn down on close: a document-level listener is an
     external system with a lifetime React does not manage. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        wrap.current?.querySelector<HTMLButtonElement>("[aria-expanded]")?.focus();
      }
    };
    const onPointer = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const entries = () => Array.from(wrap.current?.querySelectorAll<HTMLElement>("[data-tk='menu-button-item']") ?? []);
  const move = (e: React.KeyboardEvent, to: (all: HTMLElement[], at: number) => number) => {
    const all = entries();
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (!all.length) return;
    e.preventDefault();
    all[to(all, at)]?.focus();
  };

  return (
    <div
      data-tk="menu-button"
      data-align={align === "end" ? "end" : undefined}
      data-open={open || undefined}
      ref={wrap}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          if (!open) {
            setOpen(true);
            e.preventDefault();
            requestAnimationFrame(() => entries()[0]?.focus());
          } else move(e, (all, at) => (at + 1) % all.length);
        } else if (e.key === "ArrowUp" && open) move(e, (all, at) => (at <= 0 ? all.length - 1 : at - 1));
        else if (e.key === "Home" && open && e.target !== wrap.current?.querySelector("[aria-expanded]")) move(e, () => 0);
        else if (e.key === "End" && open && e.target !== wrap.current?.querySelector("[aria-expanded]")) move(e, (all) => all.length - 1);
      }}
      {...rest}
    >
      <button
        data-tk="button"
        data-variant={variant}
        data-size={size === "md" ? undefined : size}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {label}
        <svg data-tk="menu-button-chevron" viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      <ul data-tk="menu-button-panel" id={panelId} hidden={!open}>
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <a data-tk="menu-button-item" href={item.href} aria-current={item.current ? "page" : undefined}>
                {item.label}
              </a>
            ) : (
              <button
                data-tk="menu-button-item"
                type="button"
                onClick={() => {
                  item.onSelect?.();
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
