"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "./Icon";

export type AudioPlayerWords = {
  play: string;
  pause: string;
  /** "{n}" is the skip in seconds. */
  back: string;
  forward: string;
  position: string;
  /** Said after the speed shown on the button: "1.5× playback speed". */
  speed: string;
  mute: string;
  transcript: string;
  download: string;
};

const WORDS: AudioPlayerWords = {
  play: "Play",
  pause: "Pause",
  back: "Back {n} seconds",
  forward: "Forward {n} seconds",
  position: "Position",
  speed: "playback speed",
  mute: "Mute",
  transcript: "Transcript",
  download: "Download the transcript",
};

export interface AudioPlayerProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** What it is. Required: it names the player and its play button. Forty characters or fewer reads best. */
  title: string;
  /** A line above the title: the series, the episode, who is speaking. Optional; eighty characters or fewer. */
  description?: string;
  /** The audio file. Nothing plays until someone presses play. */
  src: string;
  /** How long it runs, as it should read before the file has said ("24:05", "1:02:30"). */
  duration?: string;
  /** The words, for anyone who would rather read or cannot hear. Shown in a disclosure under the player. */
  transcript?: ReactNode;
  /** Where the whole transcript can be downloaded. */
  transcriptHref?: string;
  /** The speeds the speed button steps through, starting at the first. */
  speeds?: number[];
  /** Seconds the back and forward buttons (and the arrow keys on the position) move. */
  skip?: number;
  words?: Partial<AudioPlayerWords>;
}

/** 65 → "1:05"; 3725 → "1:02:05". */
function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60), m = Math.floor((seconds / 60) % 60), h = Math.floor(seconds / 3600);
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "24:05" → 1445. NaN when it is not a clock reading. */
function seconds(reading?: string): number {
  if (!reading) return NaN;
  const parts = reading.trim().split(":").map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !Number.isFinite(p))) return NaN;
  return parts.reduce((t, p) => t * 60 + p, 0);
}

const rate = (r: number) => `${Number.isInteger(r) ? r : String(r).replace(/0+$/, "")}×`;

/**
 * AudioPlayer — a clip or an episode, played on the page.
 *
 * A native audio element underneath, with the kit's own controls over it, so
 * every control is a real button or slider a keyboard and a screen reader
 * already know: play and pause, back and forward fifteen seconds, the
 * position (arrow keys move it by the same fifteen), the time, the speed and
 * mute. Volume is left to the device. It never plays by itself: nothing
 * sounds until someone presses play. A transcript, when there is one, opens
 * under the controls for anyone who would rather read or cannot hear.
 */
export function AudioPlayer({
  title,
  description,
  src,
  duration,
  transcript,
  transcriptHref,
  speeds = [1, 1.25, 1.5, 2, 0.75],
  skip = 15,
  words,
  ...rest
}: AudioPlayerProps) {
  const w = { ...WORDS, ...words };
  const id = useId();
  const titleId = `${id}-title`;
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [total, setTotal] = useState(() => seconds(duration));
  const [speed, setSpeed] = useState(speeds[0] ?? 1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const sync = () => {
      setPlaying(!a.paused && !a.ended);
      setNow(a.currentTime);
      if (Number.isFinite(a.duration) && a.duration > 0) setTotal(a.duration);
      setMuted(a.muted);
      setSpeed(a.playbackRate);
    };
    const kinds = ["play", "pause", "ended", "timeupdate", "loadedmetadata", "durationchange", "ratechange", "volumechange", "seeked"];
    kinds.forEach((k) => a.addEventListener(k, sync));
    sync();
    return () => kinds.forEach((k) => a.removeEventListener(k, sync));
  }, [src]);

  const a = () => audio.current;
  const toggle = () => {
    const el = a();
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };
  const jump = (by: number) => {
    const el = a();
    if (!el) return;
    const end = Number.isFinite(el.duration) ? el.duration : total;
    el.currentTime = Math.max(0, Math.min(Number.isFinite(end) ? end : Infinity, el.currentTime + by));
    setNow(el.currentTime);
  };
  const nextSpeed = () => {
    const el = a();
    const i = speeds.indexOf(speed);
    const next = speeds[(i + 1) % speeds.length] ?? 1;
    if (el) el.playbackRate = next;
    setSpeed(next);
  };
  const onPositionKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") jump(-skip);
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") jump(skip);
    else return;
    e.preventDefault();
  };

  const max = Number.isFinite(total) ? total : 0;
  const n = String(skip);

  return (
    <section {...rest} data-tk="audio-player" aria-labelledby={titleId}>
      <audio ref={audio} src={src} preload="metadata" data-tk="audio-player-media" />
      <button
        type="button"
        data-tk="audio-player-play"
        aria-label={`${playing ? w.pause : w.play}: ${title}`}
        onClick={toggle}
      >
        <Icon name={playing ? "pause" : "play"} />
      </button>
      <div data-tk="audio-player-info">
        {description ? <p data-tk="audio-player-description">{description}</p> : null}
        <p data-tk="audio-player-title" id={titleId}>
          {title}
        </p>
      </div>
      <div data-tk="audio-player-tools">
        <button type="button" data-tk="audio-player-tool" aria-label={w.back.replace("{n}", n)} onClick={() => jump(-skip)}>
          <Icon name="undo" />
        </button>
        <button type="button" data-tk="audio-player-tool" aria-label={w.forward.replace("{n}", n)} onClick={() => jump(skip)}>
          <Icon name="redo" />
        </button>
        <button type="button" data-tk="audio-player-speed" aria-label={`${rate(speed)} ${w.speed}`} onClick={nextSpeed}>
          {rate(speed)}
        </button>
        <button
          type="button"
          data-tk="audio-player-tool"
          aria-label={w.mute}
          aria-pressed={muted}
          onClick={() => {
            const el = a();
            if (el) el.muted = !el.muted;
          }}
        >
          <Icon name={muted ? "volumeOff" : "volume"} />
        </button>
      </div>
      <div data-tk="audio-player-track">
        <span data-tk="audio-player-time" aria-hidden="true">
          {clock(now)}
        </span>
        <input
          type="range"
          data-tk="audio-player-position"
          aria-label={w.position}
          aria-valuetext={`${clock(now)} of ${clock(max)}`}
          min={0}
          max={max}
          step={1}
          value={Math.min(now, max)}
          onKeyDown={onPositionKey}
          onChange={(e) => {
            const el = a();
            const t = Number(e.currentTarget.value);
            if (el) el.currentTime = t;
            setNow(t);
          }}
        />
        <span data-tk="audio-player-time" aria-hidden="true">
          {clock(max)}
        </span>
      </div>
      {transcript ? (
        <details data-tk="audio-player-transcript">
          <summary data-tk="audio-player-transcript-toggle">{w.transcript}</summary>
          <div data-tk="audio-player-transcript-body">
            {transcript}
            {transcriptHref ? (
              <p>
                <a href={transcriptHref} download>
                  {w.download}
                </a>
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  );
}
