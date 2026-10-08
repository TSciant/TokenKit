import type { HTMLAttributes, ReactNode } from "react";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  status?: "info" | "success" | "warning" | "danger";
  title?: string;
  /** Announce changes to assistive tech. Use for errors and async results. */
  live?: boolean;
  /**
   * One action beside the message: Undo after something was done, Retry
   * after something failed, a link to what changed. For an action that can
   * be undone, do it and offer Undo here rather than asking first.
   */
  action?: ReactNode;
  children?: ReactNode;
}

export function Alert({ status, title, live, action, children, ...rest }: AlertProps) {
  return (
    <div
      {...rest}
      data-tk="alert"
      data-status={status === "info" ? undefined : status}
      role={status === "danger" ? "alert" : live ? "status" : undefined}
      aria-live={live && status !== "danger" ? "polite" : undefined}
    >
      <div data-tk="alert-body">
        {title ? <p data-tk="alert-title">{title}</p> : null}
        {children}
      </div>
      {action ? <div data-tk="alert-action">{action}</div> : null}
    </div>
  );
}
