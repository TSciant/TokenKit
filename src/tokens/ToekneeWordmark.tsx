/**
 * ToekneeWordmark — toe knee → token → token kit.
 *
 * T and K are pivots: they travel less and lead the rearrange. Other glyphs
 * ease into place around them. Three beats, contract-timed, reduced-motion
 * hard-cuts to the final frame.
 */
import {
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import { durationToSeconds, easeToArray } from "../lib/motion-tokens";

export type ToekneeWordmarkProps = {
  width?: number;
  height?: number;
  autoplay?: boolean;
  className?: string;
  style?: CSSProperties;
};

type Pt = { x: number; y: number; opacity: number; ch: string };

type Glyph = {
  /** Display character (may change across beats for spawned letters). */
  ch: string;
  /** Role: pivot letters ease with less travel / lead the stagger. */
  pivot?: "t" | "k";
  a: Pt; // toe knee
  b: Pt; // token
  c: Pt; // token kit
};

const FONT_WEIGHT = 600;

function measureRun(
  ctx: CanvasRenderingContext2D,
  text: string,
): { widths: number[]; total: number } {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  return { widths, total: widths.reduce((a, b) => a + b, 0) };
}

function layoutCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  baseline: number,
): Pt[] {
  const { widths, total } = measureRun(ctx, text);
  let x = (w - total) / 2;
  return [...text].map((ch, i) => {
    const pt = { x, y: baseline, opacity: ch === " " ? 0 : 1, ch };
    x += widths[i];
    return pt;
  });
}

/**
 * Build glyphs with T/K as pivots.
 *
 * toe knee : t o e _ k n e e
 * token    : t o k e n
 * token kit: t o k e n _ k i t
 */
function buildGlyphs(
  ctx: CanvasRenderingContext2D,
  font: string,
  w: number,
  h: number,
): Glyph[] {
  ctx.font = font;
  const baseline = h * 0.58;
  const s1 = layoutCentered(ctx, "toe knee", w, baseline);
  const s2 = layoutCentered(ctx, "token", w, baseline);
  const s3 = layoutCentered(ctx, "token kit", w, baseline);

  // Indices: toe knee 0t 1o 2e 3sp 4k 5n 6e 7e
  // token:        0t 1o 2k 3e 4n
  // token kit:    0t 1o 2k 3e 4n 5sp 6k 7i 8t

  const invisible = (x: number, y: number, ch = ""): Pt => ({
    x,
    y,
    opacity: 0,
    ch,
  });

  const glyphs: Glyph[] = [
    // Pivot T — stays the leading T through all three beats
    {
      ch: "t",
      pivot: "t",
      a: { ...s1[0], ch: "t" },
      b: { ...s2[0], ch: "t" },
      c: { ...s3[0], ch: "t" },
    },
    // o
    {
      ch: "o",
      a: { ...s1[1], ch: "o" },
      b: { ...s2[1], ch: "o" },
      c: { ...s3[1], ch: "o" },
    },
    // Pivot K — from knee into token, then holds as token's k
    {
      ch: "k",
      pivot: "k",
      a: { ...s1[4], ch: "k" },
      b: { ...s2[2], ch: "k" },
      c: { ...s3[2], ch: "k" },
    },
    // e (from toe's e → token e → token kit e)
    {
      ch: "e",
      a: { ...s1[2], ch: "e" },
      b: { ...s2[3], ch: "e" },
      c: { ...s3[3], ch: "e" },
    },
    // n
    {
      ch: "n",
      a: { ...s1[5], ch: "n" },
      b: { ...s2[4], ch: "n" },
      c: { ...s3[4], ch: "n" },
    },
    // space in "toe knee" fades; reappears before kit
    {
      ch: " ",
      a: { ...s1[3], ch: " ", opacity: 0 },
      b: invisible(s2[4].x + 8, baseline, " "),
      c: { ...s3[5], ch: " ", opacity: 0 },
    },
    // leftover e from knee — dissolves after beat 1
    {
      ch: "e",
      a: { ...s1[6], ch: "e" },
      b: invisible(s1[6].x, baseline - 28, "e"),
      c: invisible(s1[6].x, baseline - 36, "e"),
    },
    // second leftover e — dissolves
    {
      ch: "e",
      a: { ...s1[7], ch: "e" },
      b: invisible(s1[7].x, baseline - 24, "e"),
      c: invisible(s1[7].x, baseline - 32, "e"),
    },
    // kit's K — born from the pivot K (starts stacked on pivot, peels to kit)
    {
      ch: "k",
      pivot: "k",
      a: invisible(s1[4].x, baseline, "k"),
      b: invisible(s2[2].x, baseline, "k"),
      c: { ...s3[6], ch: "k" },
    },
    // i — arrives for kit
    {
      ch: "i",
      a: invisible(s1[5].x, baseline + 10, "i"),
      b: invisible(s2[4].x, baseline + 8, "i"),
      c: { ...s3[7], ch: "i" },
    },
    // kit's T — second t, echoes the pivot t
    {
      ch: "t",
      pivot: "t",
      a: invisible(s1[0].x, baseline, "t"),
      b: invisible(s2[0].x, baseline, "t"),
      c: { ...s3[8], ch: "t" },
    },
  ];

  return glyphs;
}

function easeY(t: number, ease: [number, number, number, number]): number {
  const [x1, y1, x2, y2] = ease;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const x =
      3 * (1 - mid) * (1 - mid) * mid * x1 +
      3 * (1 - mid) * mid * mid * x2 +
      mid * mid * mid;
    if (x < t) lo = mid;
    else hi = mid;
  }
  const u = (lo + hi) / 2;
  return (
    3 * (1 - u) * (1 - u) * u * y1 +
    3 * (1 - u) * u * u * y2 +
    u * u * u
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Stagger: pivots lead, others follow. */
function glyphProgress(globalP: number, g: Glyph, i: number): number {
  const lead = g.pivot ? 0 : 0.08 + (i % 5) * 0.02;
  const span = 1 - lead * 0.85;
  return smoothstep((globalP - lead) / span);
}

function mix(a: Pt, b: Pt, t: number): Pt {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    opacity: lerp(a.opacity, b.opacity, t),
    ch: t < 0.5 ? a.ch : b.ch,
  };
}

export function ToekneeWordmark({
  width = 640,
  height = 168,
  autoplay = true,
  className,
  style,
}: ToekneeWordmarkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const playGen = useRef(0);

  const play = useCallback(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cs = getComputedStyle(host);
    const ink = cs.getPropertyValue("--tk-text-primary").trim() || "#111";
    const mute = cs.getPropertyValue("--tk-text-tertiary").trim() || "#888";
    const fontFamily =
      cs.getPropertyValue("--tk-font-sans").trim() || "system-ui, sans-serif";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fontSize = Math.min(56, width * 0.09);
    const font = `${FONT_WEIGHT} ${fontSize}px ${fontFamily}`;
    ctx.font = font;
    ctx.textBaseline = "alphabetic";

    const glyphs = buildGlyphs(ctx, font, width, height);

    const transformRaw = cs.getPropertyValue("--tk-motion-transform").trim();
    const easeEntrance = easeToArray(
      cs.getPropertyValue("--tk-ease-entrance").trim() ||
        "cubic-bezier(0.16, 1, 0.3, 1)",
    );
    const easeStandard = easeToArray(
      cs.getPropertyValue("--tk-ease-standard").trim() ||
        "cubic-bezier(0.2, 0, 0, 1)",
    );

    const beatMs =
      durationToSeconds(transformRaw.split(/\s+/)[0] || "420ms") * 1000 * 1.85;
    const hold1 = 560;
    const hold2 = 420;
    const holdEnd = 900;

    const gen = ++playGen.current;
    cancelAnimationFrame(rafRef.current);

    const drawPts = (pts: Pt[]) => {
      ctx.clearRect(0, 0, width, height);
      pts.forEach((pt, i) => {
        if (!pt.ch || pt.opacity <= 0.01) return;
        const g = glyphs[i];
        ctx.globalAlpha = Math.max(0, Math.min(1, pt.opacity));
        ctx.fillStyle = g.pivot ? ink : pt.opacity < 0.95 ? mute : ink;
        // Slight weight emphasis on pivots via shadow bloom
        if (g.pivot && pt.opacity > 0.5) {
          ctx.save();
          ctx.shadowColor = ink;
          ctx.shadowBlur = 0.4;
          ctx.fillText(pt.ch, pt.x, pt.y);
          ctx.restore();
        } else {
          ctx.fillText(pt.ch, pt.x, pt.y);
        }
      });
      ctx.globalAlpha = 1;
    };

    const frameAt = (
      phase: "a" | "ab" | "b" | "bc" | "c",
      p: number,
    ) => {
      const pts = glyphs.map((g, i) => {
        const local = glyphProgress(p, g, i);
        if (phase === "a") return g.a;
        if (phase === "b") return g.b;
        if (phase === "c") return g.c;
        if (phase === "ab") return mix(g.a, g.b, local);
        return mix(g.b, g.c, local);
      });
      drawPts(pts);
    };

    if (reduced) {
      frameAt("c", 1);
      return;
    }

    const t0 = performance.now();
    const tick = (now: number) => {
      if (gen !== playGen.current) return;
      const e = now - t0;

      // Beat timeline: hold A → morph AB → hold B → morph BC → hold C
      const tAb0 = hold1;
      const tAb1 = tAb0 + beatMs;
      const tBc0 = tAb1 + hold2;
      const tBc1 = tBc0 + beatMs * 1.05;
      const tEnd = tBc1 + holdEnd;

      if (e < tAb0) {
        frameAt("a", 0);
      } else if (e < tAb1) {
        const u = (e - tAb0) / (tAb1 - tAb0);
        frameAt("ab", easeY(u, easeEntrance));
      } else if (e < tBc0) {
        frameAt("b", 1);
      } else if (e < tBc1) {
        const u = (e - tBc0) / (tBc1 - tBc0);
        frameAt("bc", easeY(u, easeStandard));
      } else {
        frameAt("c", 1);
        if (e >= tEnd) return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [width, height]);

  useEffect(() => {
    if (autoplay) {
      const id = requestAnimationFrame(() => play());
      return () => {
        cancelAnimationFrame(id);
        cancelAnimationFrame(rafRef.current);
      };
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoplay, play]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        display: "inline-block",
        cursor: "pointer",
        lineHeight: 0,
        borderRadius: "var(--tk-radius-nested, 8px)",
        outlineOffset: 4,
        ...style,
      }}
      onClick={play}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          play();
        }
      }}
      role="img"
      aria-label="toe knee becomes token becomes token kit"
      tabIndex={0}
      title="Click to replay"
    >
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
}
