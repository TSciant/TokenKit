import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

export type TimelineItem = {
  id?: string;
  /** Where it starts, on the timeline's scale (a year, a day number, a minute). */
  start: number;
  /** Where it ends. Leave it out for a milestone: a single point in time. */
  end?: number;
  label: string;
  /**
   * More about it: any content. A sentence; a sentence and a Code snippet; a
   * Figure. Shown while the item is current: under the chart, or in a journey
   * as the milestone's callout (laid out for every milestone, so the journey
   * keeps its height).
   */
  detail?: ReactNode;
  /** The item being looked at now. Marks it, and shows its detail. */
  current?: boolean;
  /** In a journey, which side of the line a milestone opens. Above when left out: below, its stem starts under the periods' band. */
  // tk-vocab: side omits start, end — those are the sidebar shell's values; a milestone sits above or below its line
  side?: "above" | "below";
};

export type TimelineLane = {
  id?: string;
  /** What the lane tracks: "Layout", "Scripting", "Paradigm". */
  label: string;
  items: TimelineItem[];
};

export interface TimelineProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** What the timeline shows. Names it for assistive technology. */
  label: string;
  /** The first and last points of the scale. */
  start: number;
  end: number;
  lanes: TimelineLane[];
  /** Distance between ticks on the axis, in the scale's units. */
  step?: number;
  /** How a point on the scale is written: a year as itself, a day as a date. */
  format?: (value: number) => string;
  /**
   * The machine-readable date for a point, when it is one (a time element's
   * datetime: "1996", "2026-03-14"). Left out, whole years from 1000 to 9999
   * are dates and anything else (a week number, a fraction of a year) is
   * written as text, not as a time element with a value that is not a date.
   */
  datetime?: (value: number) => string | undefined;
  /** The words the timeline says for itself, for a page in another language. */
  words?: { milestones?: string; periods?: string; to?: string };
  /** The part of the scale in view. Defaults to all of it; narrow it to zoom, move it to pan. */
  view?: [number, number];
  /** A point marked with a line across every lane ("today"). */
  now?: number;
  /** The words for the now line. */
  nowLabel?: string;
  /**
   * How it is drawn. "lanes" (the default): a Gantt chart, one row per lane.
   * "journey": one line that travels the scale, its milestones as dots
   * along it (the current one unfolding into a callout: its year, name and
   * detail) and its spans as periods drawn under it. For telling a story
   * one moment at a time rather than showing everything at once.
   */
  variant?: "lanes" | "journey";
  /**
   * How far along the scale the story has got. The journey's line is drawn
   * to here; milestones and periods emerge as it reaches them, and periods grow
   * behind it. A registered number, so moving it is a transition: on a page
   * the line draws itself, and a frame-by-frame recording is exact. Defaults
   * to the end: everything shown.
   */
  reveal?: number;
  /**
   * In a journey, how far the current milestone has been told, 0 to 1: its dot
   * lands, its stem draws, its rule runs out, then its year, name and detail
   * arrive. Leave it out and becoming current is a transition in the kit's
   * motion; set it to draw the telling frame by frame (a film).
   */
  tell?: number;
}

const YEAR = (v: number) => (Number.isInteger(v) && v >= 1000 && v <= 9999 ? String(v) : undefined);
const WORDS = { milestones: "Milestones", periods: "Periods", to: "to" };

/** A point on the scale: a time element when it is a date, text when it is not. */
function at(v: number, format: (v: number) => string, datetime: (v: number) => string | undefined) {
  const d = datetime(v);
  return d ? <time dateTime={d}>{format(v)}</time> : format(v);
}

/**
 * What a screen reader hears when the current item changes: its name and when
 * it was. A polite live region that is always there, so the first change is
 * announced, and never says anything on arrival.
 */
function Status({ item, when }: { item?: TimelineItem; when: (it: TimelineItem) => string }) {
  return (
    <p data-tk="visually-hidden" aria-live="polite" aria-atomic="true">
      {item ? `${item.label}, ${when(item)}` : ""}
    </p>
  );
}

/** Each item's row within its lane, so items that overlap in time stack instead of colliding. */
function pack(items: TimelineItem[]): number[] {
  const order = items.map((_, i) => i).sort((a, b) => items[a].start - items[b].start);
  const rowEnds: number[] = [];
  const rows = new Array<number>(items.length);
  for (const i of order) {
    const it = items[i];
    const end = it.end ?? it.start;
    let row = rowEnds.findIndex((e) => e < it.start);
    if (row === -1) row = rowEnds.length;
    rowEnds[row] = end;
    rows[i] = row;
  }
  return rows;
}

/**
 * Timeline — things across time, in lanes: spans (a start and an end) and
 * milestones (a single point), on one scale.
 *
 * Use for: how several threads ran side by side and overlapped (eras, a
 * project's phases, a release history). Don't use for: a list of dated events
 * with no duration and one thread (an event list), or exact values a reader
 * must compare (a table).
 *
 * It is lists underneath. Each lane is a labelled group, each item a list item
 * that says its dates in words, in time elements; the bars, the axis and the
 * ticks are drawn from that and hidden from assistive technology, which reads
 * the lists. In a box narrower than 40rem the drawing goes and the lists show
 * as they are, dates and all: a Gantt chart squeezed onto a phone is a strip
 * of unreadable slivers.
 *
 * `view` is the window onto the scale. It is two registered custom
 * properties, so moving it is a CSS transition in the kit's motion: a
 * timeline can pan and zoom by changing two numbers. A label whose item
 * starts before the window stays at the window's edge; one in the last
 * stretch of the window sits at its bar's end instead, so neither is cut
 * off. The current item is
 * marked with aria-current, which is also what draws it, and its detail
 * shows under the chart.
 */
export function Timeline({
  label,
  start,
  end,
  lanes,
  step,
  format = (v) => String(v),
  datetime = YEAR,
  words: wordsIn,
  view,
  now,
  nowLabel = "Now",
  variant = "lanes",
  reveal,
  tell,
  style,
  ...rest
}: TimelineProps) {
  const words = { ...WORDS, ...wordsIn };
  const base = useId();
  const [from, to] = view ?? [start, end];
  if (variant === "journey") {
    return (
      <Journey label={label} start={start} end={end} lanes={lanes} step={step} format={format} datetime={datetime} words={words} from={from} to={to} reveal={reveal ?? end} tell={tell} style={style} {...rest} />
    );
  }
  const span = end - start;
  const tickStep = step ?? Math.max(1, Math.round(span / 6));
  const ticks: number[] = [];
  for (let t = Math.ceil(start / tickStep) * tickStep; t <= end; t += tickStep) ticks.push(t);
  const when = (it: TimelineItem) => (it.end === undefined ? format(it.start) : `${format(it.start)} ${words.to} ${format(it.end)}`);
  const currents = lanes.flatMap((lane) => lane.items.filter((it) => it.current && it.detail));

  const vars = {
    "--tk-timeline-from": from,
    "--tk-timeline-to": to,
    ...style,
  } as CSSProperties;

  return (
    <section data-tk="timeline" aria-label={label} style={vars} {...rest}>
      <div data-tk="timeline-chart">
        <div data-tk="timeline-axis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} data-tk="timeline-tick" style={{ "--_at": t } as CSSProperties}>
              {format(t)}
            </span>
          ))}
        </div>
        {lanes.map((lane, li) => {
          const rows = pack(lane.items);
          const height = Math.max(1, ...rows.map((r) => r + 1));
          return (
            <div key={lane.id ?? li} data-tk="timeline-lane" role="group" aria-labelledby={`${base}-lane-${li}`}>
              <p data-tk="timeline-lane-label" id={`${base}-lane-${li}`} aria-hidden="true">
                {lane.label}
              </p>
              <ol data-tk="timeline-track" style={{ "--_rows": height } as CSSProperties}>
                {lane.items.map((it, ii) => (
                  <li
                    key={it.id ?? `${li}-${ii}`}
                    data-tk="timeline-item"
                    data-milestone={it.end === undefined ? "" : undefined}
                    data-label={(it.start - from) / (to - from) > 0.7 ? "end" : undefined}
                    data-out={it.start >= to || (it.end ?? it.start) <= from ? "" : undefined}
                    aria-current={it.current ? "true" : undefined}
                    style={{ "--_start": it.start, "--_end": it.end ?? it.start, "--_row": rows[ii] } as CSSProperties}
                  >
                    <span data-tk="timeline-bar" aria-hidden="true" />
                    <span data-tk="timeline-item-label">{it.label}</span>
                    <span data-tk="timeline-when">
                      {it.end === undefined ? (
                        at(it.start, format, datetime)
                      ) : (
                        <>
                          {at(it.start, format, datetime)} {words.to} {at(it.end, format, datetime)}
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
        {now !== undefined ? (
          <div data-tk="timeline-now" style={{ "--_at": now } as CSSProperties} aria-hidden="true">
            <span>{nowLabel}</span>
          </div>
        ) : null}
      </div>
      {currents.length ? (
        <div data-tk="timeline-detail">
          {currents.map((it, i) => (
            <div key={it.id ?? i} data-tk="timeline-detail-item">
              <p data-tk="timeline-detail-title">
                {it.label} <span data-tk="timeline-when">{when(it)}</span>
              </p>
              {it.detail}
            </div>
          ))}
        </div>
      ) : null}
      <Status item={lanes.flatMap((lane) => lane.items).find((it) => it.current)} when={when} />
    </section>
  );
}

/* --- journey ---------------------------------------------------------------- */

type JourneyProps = Omit<TimelineProps, "view" | "variant" | "now" | "nowLabel" | "reveal" | "words" | "datetime"> & {
  from: number;
  to: number;
  reveal: number;
  words: typeof WORDS;
  datetime: (value: number) => string | undefined;
};

/**
 * One line across the scale. Milestones are dots on it, the current one
 * opened into a callout; spans are periods under it. Two lists underneath,
 * in time order, so a screen reader hears the story the line tells; the
 * milestone being told is the current step, and a step to another is
 * announced.
 */
function Journey({ label, start, end, lanes, step, format = (v) => String(v), datetime, words, from, to, reveal, tell, style, ...rest }: JourneyProps) {
  const all = lanes.flatMap((lane) => lane.items);
  const milestones = all.filter((it) => it.end === undefined).sort((a, b) => a.start - b.start);
  const periods = all.filter((it) => it.end !== undefined).sort((a, b) => a.start - b.start);
  const tickStep = step ?? Math.max(1, Math.round((end - start) / 6));
  const ticks: number[] = [];
  for (let t = Math.ceil(start / tickStep) * tickStep; t <= end; t += tickStep) ticks.push(t);
  const vars = { "--tk-timeline-from": from, "--tk-timeline-to": to, "--tk-timeline-reveal": reveal, ...(tell === undefined ? null : { "--tk-timeline-tell": tell }), ...style } as CSSProperties;

  return (
    <section data-tk="timeline" data-variant="journey" aria-label={label} style={vars} {...rest}>
      <div data-tk="timeline-journey">
        <div data-tk="timeline-rail" aria-hidden="true">
          <span data-tk="timeline-line" />
          <span data-tk="timeline-head" />
          {ticks.map((t) => (
            <span key={t} data-tk="timeline-tick" style={{ "--_at": t } as CSSProperties}>
              {format(t)}
            </span>
          ))}
        </div>
        <ol data-tk="timeline-milestones" aria-label={words.milestones}>
          {milestones.map((it, i) => (
            <li
              key={it.id ?? i}
              data-tk="timeline-milestone"
              data-side={it.side ?? "above"}
              data-label={(it.start - from) / (to - from) > 0.55 ? "end" : undefined}
              aria-current={it.current ? "step" : undefined}
              style={{ "--_start": it.start } as CSSProperties}
            >
              <span data-tk="timeline-milestone-label">
                <span data-tk="timeline-when">{at(it.start, format, datetime)}</span>{" "}
                <span data-tk="timeline-item-label">{it.label}</span>
              </span>
              {it.detail ? <div data-tk="timeline-milestone-detail">{it.detail}</div> : null}
            </li>
          ))}
        </ol>
        <ol data-tk="timeline-periods" aria-label={words.periods}>
          {periods.map((it, i) => (
            <li
              key={it.id ?? i}
              data-tk="timeline-period"
              aria-current={it.current ? "true" : undefined}
              style={{ "--_start": it.start, "--_end": it.end } as CSSProperties}
            >
              <span data-tk="timeline-bar" aria-hidden="true" />
              <span data-tk="timeline-item-label">{it.label}</span>
              <span data-tk="timeline-when">
                {at(it.start, format, datetime)} {words.to} {at(it.end!, format, datetime)}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <Status item={milestones.find((it) => it.current)} when={(it) => format(it.start)} />
    </section>
  );
}
