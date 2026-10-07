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
import { ButtonGroup, type ButtonGroupAction } from "./ButtonGroup";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps
  extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open"> {
  open: boolean;
  onClose: () => void;
  title: string;
  /**
   * One or two sentences under the title, read with it when the dialog opens
   * (aria-describedby). Use it when the title alone does not say what is at
   * stake; for a confirmation, it is the consequence.
   */
  description?: ReactNode;
  /**
   * An alert dialog (role="alertdialog"): the kind that interrupts on purpose
   * to confirm something that cannot be undone. Without a description it is
   * described by its body, so the consequence is read when it opens.
   */
  alert?: boolean;
  children?: ReactNode;
  /**
   * The footer's actions, as a ButtonGroup: end-aligned, equal widths, in
   * reading order. Write them Cancel first, the action last (the action is
   * the solid one, or the danger one). In a narrow dialog they stack, still
   * in that order. Preferred to `footer` for buttons.
   */
  actions?: ButtonGroupAction[];
  /** Free footer content, for anything that is not a row of buttons. */
  footer?: ReactNode;
  /**
   * Close when the backdrop is clicked. By default only a modal with no
   * footer does: one with actions (a form, a confirmation) closes by its
   * buttons, Escape or Close, so a stray click outside cannot throw away
   * what was typed. Carbon's rule; the ds-corpus modal brief.
   */
  closeOnBackdrop?: boolean;
  /**
   * false: a decision that has to be made. No Close button, Escape does
   * nothing, a click outside does nothing; the only ways out are the
   * actions, so give it at least two that both close it. For the rare case
   * where carrying on without an answer would lose something (a session
   * about to time out), almost never otherwise. USWDS's forced action; the
   * ds-corpus modal brief. Default true.
   */
  dismissible?: boolean;
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
  description,
  alert,
  children,
  actions,
  footer,
  closeOnBackdrop,
  dismissible = true,
  size = "md",
  ...rest
}: ModalProps) {
  const hasFooter = Boolean(footer) || Boolean(actions?.length);
  const backdropCloses = dismissible && (closeOnBackdrop ?? !hasFooter);
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const bodyId = useId();
  const hasBody = children != null && children !== false;
  const describedBy = description ? descId : alert && hasBody ? bodyId : undefined;
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
      aria-describedby={describedBy}
      role={alert ? "alertdialog" : undefined}
      /* Escape is stopped at the key, not only at the cancel event: Chrome
         lets a second Escape with no click in between close a dialog whatever
         cancel says, and keydown is before that. */
      onKeyDown={(e) => {
        if (!dismissible && e.key === "Escape") e.preventDefault();
      }}
      onCancel={(e) => {
        if (!dismissible) e.preventDefault();
      }}
      onClick={(e) => {
        if (!backdropCloses) return;
        if (e.target === ref.current) ref.current?.close();
      }}
      {...rest}
    >
      <ModalPanel
        title={title}
        description={description}
        actions={actions}
        footer={footer}
        dismissible={dismissible}
        onDismiss={() => ref.current?.close()}
        ids={{ title: titleId, description: descId, body: bodyId }}
      >
        {children}
      </ModalPanel>
    </dialog>
  );
}

export type ModalPanelProps = Pick<
  ModalProps,
  "title" | "description" | "children" | "actions" | "footer" | "dismissible"
> & {
  /** Close was pressed. Inside Modal this closes the dialog. */
  onDismiss?: () => void;
  /** Element ids for the dialog's aria wiring; Modal supplies them. */
  ids?: { title?: string; description?: string; body?: string };
  /** Panel width when shown on its own, as in Modal. Default md. */
  size?: ModalSize;
};

/**
 * The panel a Modal draws: header, body, footer and Close. Modal renders it
 * inside the dialog; on its own it shows a modal in place, in the page, which
 * is what guidance and documentation need (a real dialog lives in the top
 * layer, over everything, one at a time). Not a way to build a non-modal
 * dialog: it has no focus handling and no role.
 */
export function ModalPanel({
  title,
  description,
  children,
  actions,
  footer,
  dismissible = true,
  onDismiss,
  ids,
  size,
}: ModalPanelProps) {
  const hasBody = children != null && children !== false;
  const hasFooter = Boolean(footer) || Boolean(actions?.length);
  return (
    <div
      data-tk="modal-panel"
      data-size={size && size !== "md" ? size : undefined}
      data-dismissible={dismissible ? undefined : "false"}
      onClick={(e) => e.stopPropagation()}
    >
      <header data-tk="modal-header">
        <h2 id={ids?.title} data-tk="modal-title">
          {title}
        </h2>
        {description ? (
          <p id={ids?.description} data-tk="modal-description">
            {description}
          </p>
        ) : null}
      </header>
      {hasBody ? (
        <div data-tk="modal-body" id={ids?.body}>
          {children}
        </div>
      ) : null}
      {hasFooter ? (
        <footer data-tk="modal-footer">
          {footer}
          {actions?.length ? <ButtonGroup label={`${title}: actions`} actions={actions} align="end" equal /> : null}
        </footer>
      ) : null}
      {/* Close is drawn top right but comes LAST in the markup. A screen
          reader meets the title and the content before "Close", and
          showModal() focuses the first focusable element, which is now the
          first field or the first action rather than Close. Both from the
          ds-corpus modal brief (USWDS on order, Carbon on initial focus),
          with no focus code. A forced decision has no Close at all. */}
      {dismissible ? (
        <button
          type="button"
          data-tk="button"
          data-variant="quiet"
          data-size="sm"
          data-modal-close=""
          aria-label="Close"
          onClick={onDismiss}
        >
          <Icon name="close" size="sm" />
        </button>
      ) : null}
    </div>
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
  closeOnBackdrop,
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
