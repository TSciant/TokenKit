"use client";
/* Client component: it falls back to initials when the photo fails to load. */

import { useState, type HTMLAttributes } from "react";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Whose it is. The initials come from it, and `label` defaults to it. */
  name: string;
  /** Their photo. Without one, or when it fails to load, their initials. */
  src?: string | null;
  /** 32, 48 or 64px. Default md (48). */
  size?: "sm" | "md" | "lg";
  /** circle for a person (the default); square for an organisation, a team or a bot. */
  shape?: "circle" | "square";
  /**
   * Name it for a screen reader. Leave it off when the person's name is
   * already beside it (the usual case): then it is decorative, and a reader
   * hears the name once, not twice.
   */
  label?: string;
}

/** "Mary Ellen Doyle" → "MD"; one letter when that is all there is. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar — someone's photo, or their initials.
 *
 * Never a generic silhouette: forty identical grey heads say "unknown
 * person" forty times, where initials tell the rows apart at a glance and
 * read plainly as "no photo yet". Initials sit on the pack's inverse surface,
 * one colour for everyone, because a colour picked from a name would mean
 * nothing. A circle is a person; a square is an organisation, a team or a bot.
 */
export function Avatar({ name, src, size = "md", shape = "circle", label, ...rest }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const photo = src && !failed;
  const named = label != null;
  return (
    <span
      data-tk="avatar"
      data-size={size === "md" ? undefined : size}
      data-shape={shape === "circle" ? undefined : shape}
      role={named ? "img" : undefined}
      aria-label={named ? label : undefined}
      aria-hidden={named ? undefined : true}
      {...rest}
    >
      {photo ? (
        <img data-tk="avatar-photo" src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        <span data-tk="avatar-initials">{initials(name)}</span>
      )}
    </span>
  );
}
