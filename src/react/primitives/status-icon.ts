import type { IconName } from "./Icon";

/**
 * The icon each status carries. A status is never colour alone (WCAG 1.4.1),
 * and the wireframe packs have no hue to spend on it at all: they stay grey
 * by decision (2026-10-18), so the word and this icon carry the meaning.
 * Chip, Alert and Toast read this one map, so a status looks the same
 * wherever it appears.
 */
export type Status = "info" | "success" | "warning" | "danger";

export const STATUS_ICON: Record<Status, IconName> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
};
