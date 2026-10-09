import type { HTMLAttributes } from "react";
import { Button } from "./Button";
import { Heading } from "./Heading";

export type AgendaSession = {
  /** When it starts, or its place in the order ("09:30", "Session 2"). */
  time?: string;
  title: string;
  /** Who leads it, one name (and role) per item. */
  speakers?: string[];
  /** A line on what it covers. */
  detail?: string;
  /** One thing to take from it: the slides, the recording. */
  action?: { label: string; href: string };
};

export interface AgendaProps extends HTMLAttributes<HTMLDivElement> {
  sessions: AgendaSession[];
  /** Said once above the list, so no row repeats it: "Times are Eastern." Optional. */
  note?: string;
  /** Each session title's heading level: h3 (the default) under a section's h2, h4 one deeper. */
  level?: 3 | 4;
}

/**
 * Agenda — one event's programme: its sessions in order, each with a time,
 * a title, who leads it, a line on what it covers and one thing to take away.
 *
 * An ordered list, because the order is the point, with the times in a column
 * of their own in figures that line up. Each session's action names the
 * session for a screen reader ("Slides for Opening remarks"), since twelve
 * links all called "Slides" are twelve identical links. A list of events,
 * each its own date, is an event list instead.
 */
export function Agenda({ sessions, note, level = 3, ...rest }: AgendaProps) {
  return (
    <div data-tk="agenda" {...rest}>
      {note ? <p data-tk="agenda-note">{note}</p> : null}
      <ol data-tk="agenda-list">
        {sessions.map((s, i) => (
          <li key={`${i}-${s.title}`} data-tk="agenda-session">
            <p data-tk="agenda-time">{s.time ?? ""}</p>
            <div data-tk="agenda-body">
              <Heading level={level} text="heading-s" data-tk="agenda-title">
                {s.title}
              </Heading>
              {s.speakers?.length ? <p data-tk="agenda-speakers">{s.speakers.join(" · ")}</p> : null}
              {s.detail ? <p data-tk="agenda-detail">{s.detail}</p> : null}
              {s.action ? (
                <span data-tk="agenda-action">
                  <Button href={s.action.href} variant="outline" size="sm">
                    {s.action.label}
                    <span data-tk="visually-hidden"> for {s.title}</span>
                  </Button>
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
