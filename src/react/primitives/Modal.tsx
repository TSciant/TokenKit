"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type DialogHTMLAttributes,
} from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps
  extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open"> {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Close when the backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  /** Panel width. Default md. */
  size?: ModalSize;
}

/**
 * Modal on native dialog. showModal() for top-layer + focus trap;
 * Escape and backdrop close; focus returns to the opener.
 * Enter/exit motion is CSS on --tk-motion-enter / exit (see modal.css).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  size = "md",
  ...rest
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onDialogClose = () => onClose();
    node.addEventListener("close", onDialogClose);

    if (open) {
      if (!node.open) {
        opener.current = document.activeElement;
        node.showModal();
      }
    } else if (node.open) {
      node.close();
      const prev = opener.current;
      if (prev instanceof HTMLElement) prev.focus();
      opener.current = null;
    }

    return () => node.removeEventListener("close", onDialogClose);
  }, [open, onClose]);

  return (
    <dialog
      ref={ref}
      data-tk="modal"
      data-size={size === "md" ? undefined : size}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (!closeOnBackdrop) return;
        if (e.target === ref.current) ref.current?.close();
      }}
      {...rest}
    >
      <div data-tk="modal-panel" onClick={(e) => e.stopPropagation()}>
        <header data-tk="modal-header">
          <h2 id={titleId} data-tk="modal-title">
            {title}
          </h2>
          <button
            type="button"
            data-tk="button"
            data-variant="quiet"
            data-size="sm"
            aria-label="Close"
            onClick={() => ref.current?.close()}
          >
            <Icon name="close" size="sm" />
          </button>
        </header>
        <div data-tk="modal-body">{children}</div>
        {footer ? <footer data-tk="modal-footer">{footer}</footer> : null}
      </div>
    </dialog>
  );
}

export type ModalTriggerProps = {
  /** Trigger label (Button children). */
  label: ReactNode;
  title: string;
  children?: ReactNode;
  /** Static footer, or render-prop with close(). */
  footer?: ReactNode | ((close: () => void) => ReactNode);
  size?: ModalSize;
  triggerVariant?: "solid" | "outline" | "quiet";
  triggerSize?: "sm" | "md" | "lg";
  closeOnBackdrop?: boolean;
};

/**
 * Composable opener + Modal. Own the open state so call sites stay declarative.
 * Trigger is a kit Button with data-tk="modal-trigger" for styling hooks.
 */
export function ModalTrigger({
  label,
  title,
  children,
  footer,
  size = "md",
  triggerVariant = "solid",
  triggerSize = "md",
  closeOnBackdrop = true,
}: ModalTriggerProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const foot =
    typeof footer === "function" ? footer(close) : footer;

  return (
    <>
      <Button
        data-modal-trigger=""
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Modal
        open={open}
        onClose={close}
        title={title}
        size={size}
        closeOnBackdrop={closeOnBackdrop}
        footer={foot}
      >
        {children}
      </Modal>
    </>
  );
}
