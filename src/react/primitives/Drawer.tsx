"use client";
/* Client component: it uses effects and the dialog element's methods. */

import { useEffect, useId, useRef, type DialogHTMLAttributes, type ReactNode } from "react";
import type { ButtonGroupAction } from "./ButtonGroup";
import { ModalPanel } from "./Modal";

export type DrawerSide = "start" | "end" | "bottom";
export type DrawerSize = "sm" | "md" | "lg";

export interface DrawerProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
  open: boolean;
  onClose: () => void;
  title: string;
  /** One or two sentences under the title, read with it when the drawer opens. */
  description?: ReactNode;
  children?: ReactNode;
  /** The footer's actions, as a ButtonGroup, Cancel first and the action last. */
  actions?: ButtonGroupAction[];
  /** Free footer content, for anything that is not a row of buttons. */
  footer?: ReactNode;
  /**
   * Which edge it comes from. end (the default) for what belongs to the page
   * in view: filters, details, a quick preview, an assistant. start for
   * navigation, and only for that. bottom for a sheet. On a phone (under
   * 40rem) a side drawer comes up from the bottom.
   */
  side?: DrawerSide;
  /** Width of a side drawer: 20, 28 or 36rem. Default md. */
  size?: DrawerSize;
  /**
   * true (the default): the page behind is blocked and dimmed until the
   * drawer closes. false: the page stays usable beside it, for something the
   * reader works alongside (an assistant, a cart, notifications); Escape and
   * Close still close it, and focus can leave it.
   */
  modal?: boolean;
  /**
   * Close when the dimmed page is clicked (modal only). By default only a
   * drawer without actions does, as with Modal: one holding a form closes by
   * its buttons, Escape or Close, so a stray click cannot lose what was typed.
   */
  closeOnBackdrop?: boolean;
}

/**
 * Drawer — a panel from the edge of the screen, on the native dialog.
 *
 * Modal's anatomy and rules on a different surface: title, a body that
 * scrolls between a fixed header and footer, actions, Close last in the
 * markup; focus moves in when it opens and back to the opener when it
 * closes. Modal by default (the page is blocked); `modal={false}` leaves the
 * page usable beside it. A side drawer is a bottom sheet on a phone.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  footer,
  side = "end",
  size = "md",
  modal = true,
  closeOnBackdrop,
  ...rest
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();
  const descId = useId();
  const hasFooter = Boolean(footer) || Boolean(actions?.length);
  const backdropCloses = modal && (closeOnBackdrop ?? !hasFooter);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onDialogClose = () => onClose();
    node.addEventListener("close", onDialogClose);
    if (open && !node.open) {
      opener.current = document.activeElement;
      if (modal) node.showModal();
      else node.show();
    } else if (!open && node.open) {
      node.close();
      const prev = opener.current;
      if (prev instanceof HTMLElement) prev.focus();
      opener.current = null;
    }
    return () => node.removeEventListener("close", onDialogClose);
  }, [open, onClose, modal]);

  return (
    <dialog
      ref={ref}
      data-tk="drawer"
      data-side={side === "end" ? undefined : side}
      data-size={size === "md" ? undefined : size}
      data-modal={modal ? undefined : "false"}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      /* A non-modal dialog gets no cancel event from Escape, so the key
         closes it here; a modal one closes by the browser's own cancel. */
      onKeyDown={(e) => {
        if (!modal && e.key === "Escape" && !e.nativeEvent.isComposing) {
          e.preventDefault();
          ref.current?.close();
        }
      }}
      onClick={(e) => {
        if (backdropCloses && e.target === ref.current) ref.current?.close();
      }}
      {...rest}
    >
      <ModalPanel
        title={title}
        description={description}
        actions={actions}
        footer={footer}
        onDismiss={() => ref.current?.close()}
        ids={{ title: titleId, description: descId }}
      >
        {children}
      </ModalPanel>
    </dialog>
  );
}

export type DrawerPanelProps = Pick<DrawerProps, "title" | "description" | "children" | "actions" | "footer" | "side" | "size">;

/**
 * The panel a Drawer draws, in place in the page, for guidance and
 * documentation: a real drawer lives in the top layer, over everything, one
 * at a time. It takes the height of what holds it. Not a way to build a
 * drawer: it has no focus handling and no role.
 */
export function DrawerPanel({ title, description, children, actions, footer, side = "end", size = "md" }: DrawerPanelProps) {
  return (
    <div
      data-tk="drawer"
      data-static=""
      data-side={side === "end" ? undefined : side}
      data-size={size === "md" ? undefined : size}
    >
      <ModalPanel title={title} description={description} actions={actions} footer={footer}>
        {children}
      </ModalPanel>
    </div>
  );
}
