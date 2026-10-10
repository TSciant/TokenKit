"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Plate } from "./Plate";

export type VideoEmbed = {
  /** Whose player: YouTube (served from youtube-nocookie.com) or Vimeo (with do-not-track). */
  provider: "youtube" | "vimeo";
  /** The video's id on that service: the part of its address after `v=` or the last slash. */
  id: string;
};

export interface VideoPlayerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** What the video is. Names the play button ("Play: <title>"), the embedded player and the transcript link. */
  title: string;
  /** The picture shown until play is pressed. Default: the kit's Plate, labelled with `posterLabel`. */
  poster?: ReactNode;
  /** The words on the default plate ("Video", "Product tour"). Ignored when `poster` is given. */
  posterLabel?: string;
  /** Width / height, as CSS reads it. The poster and the player share it, so nothing shifts on play. */
  ratio?: string;
  /** How long it runs, as it should read on the poster: "4:05", "52:14", "1:02:30". */
  duration?: string;
  /** A self-hosted file. After play, a native <video> with controls plays it. Wins over `embed`. */
  src?: string;
  /** A video on YouTube or Vimeo. After play, that service's player in an iframe. Nothing loads before. */
  embed?: VideoEmbed;
  /** The video has captions: marks the poster "CC" (said as "Captions available"). */
  captions?: boolean;
  /** Where its transcript is. Adds a "Transcript" link under the player. */
  transcriptHref?: string;
}

/** "52:14" → "PT52M14S", for <time datetime>. Undefined when it is not a clock reading. */
function isoDuration(clock: string): string | undefined {
  const parts = clock.trim().split(":");
  if (parts.length < 2 || parts.length > 3 || !parts.every((p) => /^\d+$/.test(p))) return undefined;
  const [h, m, s] = parts.length === 3 ? parts.map(Number) : [0, ...parts.map(Number)];
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s}S`;
}

function embedUrl({ provider, id }: VideoEmbed): string {
  const v = encodeURIComponent(id);
  return provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${v}?autoplay=1&dnt=1`;
}

/**
 * VideoPlayer — a video shown as its poster until the viewer presses play.
 *
 * Nothing from a third party loads before that press: no player script, no
 * iframe, no cookie, no request to YouTube or Vimeo. A page with three videos
 * on it costs three pictures, and a reader who never presses play has told
 * nobody they were there. Pressing play swaps the poster for the player in
 * the same box at the same ratio (a native <video> for a self-hosted `src`;
 * youtube-nocookie.com or Vimeo with do-not-track for an `embed`) and moves
 * focus into it, so a keyboard user carries on where they pressed.
 *
 * The play button is a real button, centred, its name "Play: " and the
 * title; the whole poster presses it. The running time and a "CC" marker sit
 * in the corner and are read as its description. With a self-hosted `src`,
 * children go inside the <video>: its <track> elements for captions. Without
 * a `src` or an `embed` there is nothing to play, and the button says it is
 * unavailable rather than doing nothing.
 */
export function VideoPlayer({
  title,
  poster,
  posterLabel,
  ratio = "16 / 9",
  duration,
  src,
  embed,
  captions = false,
  transcriptHref,
  children,
  style,
  ...rest
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<HTMLVideoElement & HTMLIFrameElement>(null);
  const metaId = useId();
  const playable = Boolean(src || embed);
  const hasMeta = Boolean(duration || captions || !playable);

  /* The button the reader pressed has just gone; focus goes to what replaced
     it, not to the top of the document. */
  useEffect(() => {
    if (playing) playerRef.current?.focus();
  }, [playing]);

  return (
    <div data-tk="video-player" {...rest} style={{ ["--_ratio" as string]: ratio, ...style }}>
      <div data-tk="video-player-frame">
        {playing && src ? (
          <video ref={playerRef} data-tk="video-player-media" src={src} controls autoPlay playsInline aria-label={title}>
            {children}
          </video>
        ) : playing && embed ? (
          <iframe
            ref={playerRef}
            data-tk="video-player-media"
            src={embedUrl(embed)}
            title={title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <>
            <div data-tk="video-player-poster">
              {poster ?? <Plate ratio={ratio} label={posterLabel} placement={false} />}
            </div>
            <button
              type="button"
              data-tk="video-player-play"
              aria-describedby={hasMeta ? metaId : undefined}
              aria-disabled={playable ? undefined : true}
              onClick={() => playable && setPlaying(true)}
            >
              <Icon name="play" size="lg" />
              <span data-tk="visually-hidden">Play: {title}</span>
            </button>
            {hasMeta ? (
              <span data-tk="video-player-meta" id={metaId}>
                {duration ? (
                  <span data-tk="video-player-badge">
                    <span data-tk="visually-hidden">Length </span>
                    <time dateTime={isoDuration(duration)}>{duration}</time>
                  </span>
                ) : null}
                {captions ? (
                  <span data-tk="video-player-badge">
                    <span aria-hidden="true">CC</span>
                    <span data-tk="visually-hidden">Captions available</span>
                  </span>
                ) : null}
                {playable ? null : <span data-tk="visually-hidden">No video to play yet</span>}
              </span>
            ) : null}
          </>
        )}
      </div>
      {transcriptHref ? (
        <p data-tk="video-player-transcript">
          <a href={transcriptHref}>
            Transcript<span data-tk="visually-hidden"> of {title}</span>
          </a>
        </p>
      ) : null}
    </div>
  );
}
