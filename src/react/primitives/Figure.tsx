"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import type { ImgHTMLAttributes, ReactNode, VideoHTMLAttributes, CSSProperties } from "react";
import { useMotionFx } from "../motion/useMotionFx";
import type { FxProp } from "../motion/types";

type Aspect = "1/1" | "4/3" | "16/9" | "21/9" | "auto";

type Shared = {
  caption?: ReactNode;
  credit?: ReactNode;
  aspect?: Aspect;
  decorative?: boolean;
  fx?: FxProp;
  style?: CSSProperties;
  className?: string;
};

export type FigureImageProps = Shared & {
  as?: "img";
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "children">;

export type FigureVideoProps = Shared & {
  as: "video";
} & Omit<VideoHTMLAttributes<HTMLVideoElement>, "children">;

export type FigureProps = FigureImageProps | FigureVideoProps;

export function Figure(props: FigureProps) {
  const {
    as = "img",
    caption,
    credit,
    aspect = "16/9",
    decorative,
    fx,
    style,
    className,
    ...rest
  } = props;

  const motion = useMotionFx(fx, "figure");

  if (
    as !== "video" &&
    !decorative &&
    !((rest as ImgHTMLAttributes<HTMLImageElement>).alt ?? "").trim()
  ) {
    console.warn(
      "[tokenkit Figure] Provide a non-empty alt, or set decorative for images that are purely visual.",
    );
  }

  const media =
    as === "video" ? (
      <video
        data-tk="figure-media"
        controls
        {...(rest as VideoHTMLAttributes<HTMLVideoElement>)}
      />
    ) : (
      <img
        data-tk="figure-media"
        alt={decorative ? "" : ((rest as ImgHTMLAttributes<HTMLImageElement>).alt ?? "")}
        aria-hidden={decorative ? true : undefined}
        {...(rest as ImgHTMLAttributes<HTMLImageElement>)}
      />
    );

  return (
    <figure
      ref={motion.ref as never}
      data-tk="figure"
      data-aspect={aspect === "auto" ? undefined : aspect}
      className={className}
      {...motion.props}
      style={{ ...motion.props.style, ...style }}
    >
      <div data-tk="figure-frame">{media}</div>
      {caption || credit ? (
        <figcaption data-tk="figure-caption">
          {caption ? <div data-tk="figure-caption-text">{caption}</div> : null}
          {credit ? <div data-tk="figure-credit">{credit}</div> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
