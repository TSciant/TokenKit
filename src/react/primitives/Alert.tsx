import type { ReactNode } from "react";

export interface AlertProps {
  status?: "info" | "success" | "warning" | "danger";
  title?: string;
  /** Announce changes to assistive tech. Use for errors and async results. */
  live?: boolean;
  children?: ReactNode;
}

export function Alert({ status, title, live, children }: AlertProps) {
  return (
    <div
      data-tk="alert"
      data-status={status === "info" ? undefined : status}
      role={status === "danger" ? "alert" : live ? "status" : undefined}
      aria-live={live && status !== "danger" ? "polite" : undefined}
    >
      <div>
        {title ? <p data-tk="alert-title">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}
