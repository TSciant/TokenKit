import type { Decorator } from "@storybook/react-vite";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addons } from "storybook/preview-api";

/**
 * Onion skin — the Figma design laid over the live component.
 *
 * A story opts in with `parameters.onion = { component, skin(args) }`. `skin`
 * returns a file name under figma/skins/<component>/, which is served at
 * /onion/. The toolbar switch is off by default and, while it is off, the skin
 * is not even requested: this is a viewing instrument, not part of the
 * component, and nothing here is imported by src/.
 *
 *   overlay     the skin at the chosen opacity and blend over the live component
 *   difference  |live - skin|: black where they agree, light where they do not
 *   split       skin on the left of a draggable seam, live on the right
 *
 * The skin is a 1x raster of the Figma node. The comparison is only honest at
 * 1x, so nothing here scales it; use the browser's zoom to look closer.
 */

export const onionGlobalType = {
  description: "Onion skin: overlay the Figma design on this component",
  toolbar: {
    title: "Onion",
    icon: "layers",
    items: [
      { value: "off", title: "Off" },
      { value: "overlay", title: "Overlay" },
      { value: "difference", title: "Difference (black = match)" },
      { value: "split", title: "Split" },
    ],
    dynamicTitle: true,
  },
};

type OnionParam = { component: string; target?: "root"; skin: (args: Record<string, unknown>, ctx: { width: number }) => string };

const bar: React.CSSProperties = {
  position: "fixed",
  inset: "auto 0 0 0",
  margin: 0,
  border: 0,
  inlineSize: "auto",
  blockSize: "auto",
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 16px",
  font: "12px/1.4 ui-monospace, Menlo, Consolas, monospace",
  color: "#fff",
  background: "rgba(20,20,20,.92)",
  zIndex: 2147483647,
};

function OnionStage({ param, mode, args, globals, children }: { param: OnionParam; mode: string; args: Record<string, unknown>; globals: Record<string, unknown>; children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  /* The three dials are globals, so the Design tab and this bar move the same
     values and either can be closed. */
  const updateGlobals = (globals: Record<string, unknown>) => addons.getChannel().emit("updateGlobals", { globals });
  const opacity = Number(globals.onionOpacity ?? 60), seam = Number(globals.onionSeam ?? 50);
  const blend = (globals.onionBlend ?? "normal") as React.CSSProperties["mixBlendMode"];
  const setOpacity = (v: number) => updateGlobals({ onionOpacity: v });
  const setSeam = (v: number) => updateGlobals({ onionSeam: v });
  const setBlend = (v: React.CSSProperties["mixBlendMode"]) => updateGlobals({ onionBlend: v });
  const [skinSize, setSkinSize] = useState<{ w: number; h: number } | null>(null);
  const file = param.skin(args, { width: box?.w ?? 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const h = host.current;
      const root = param.target === "root" ? (h?.querySelector<HTMLElement>(".sb-host")?.firstElementChild as HTMLElement | null) : h?.querySelector<HTMLElement>("[data-tk]");
      if (!h || !root) return;
      const a = h.getBoundingClientRect(), r = root.getBoundingClientRect();
      /* A modal is in the browser's top layer: nothing outside the dialog can
         paint over it, so the skin is drawn inside it, at its own corner. */
      setDialog(root instanceof HTMLDialogElement ? root : null);
      setBox(root instanceof HTMLDialogElement ? { x: 0, y: 0, w: r.width, h: r.height } : { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (host.current) ro.observe(host.current);
    host.current?.querySelectorAll("[data-tk]").forEach((e) => ro.observe(e));
    return () => ro.disconnect();
  }, [file, args]);

  useEffect(() => { setSkinSize(null); }, [file]);

  /* Tell the Design tab which skin is on and how the two sizes compare. */
  useEffect(() => {
    addons.getChannel().emit("tokenkit/onion", { component: param.component, file, skin: skinSize && [skinSize.w, skinSize.h], live: box && [+box.w.toFixed(1), +box.h.toFixed(1)] });
  }, [param.component, file, skinSize, box?.w, box?.h]);

  /* The control bar goes in the top layer too, and after any dialog, so a modal's
     backdrop does not dim the controls that are measuring it. */
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current as (HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void }) | null;
    if (!el?.showPopover) return;
    const t = setTimeout(() => { try { el.hidePopover?.(); el.showPopover?.(); } catch { /* already shown */ } }, 50);
    return () => clearTimeout(t);
  }, [mode, dialog]);

  const w = skinSize?.w ?? box?.w ?? 0, h = skinSize?.h ?? box?.h ?? 0;
  const clip = mode === "split" ? `inset(0 ${100 - seam}% 0 0)` : undefined;
  const skinImg = box && (
    <img
      alt=""
      src={`/onion/${param.component}/${file}`}
      onLoad={(e) => setSkinSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      style={{
        position: "absolute", left: box.x, top: box.y, width: w || undefined, height: h || undefined,
        pointerEvents: "none", imageRendering: "pixelated",
        opacity: mode === "overlay" ? opacity / 100 : 1,
        mixBlendMode: mode === "difference" ? "difference" : mode === "overlay" ? blend : "normal",
        clipPath: clip,
      }}
    />
  );

  return (
    <>
      {/* The design was drawn on surface-default; a transparent component is baked onto it in the skin. */}
      <div ref={host} style={{ position: "relative", isolation: "isolate", display: "block", background: "var(--tk-surface-default)" }}>
        {children}
        {box && !dialog && skinImg}
      </div>
      {dialog && skinImg && createPortal(skinImg, dialog)}
      <div ref={barRef} {...({ popover: "manual" } as object)} style={bar} role="group" aria-label="Onion skin">
        <span>Figma skin: {param.component}/{file}</span>
        <span>skin {skinSize ? `${skinSize.w}×${skinSize.h}` : "…"} · live {box ? `${box.w.toFixed(1)}×${box.h.toFixed(1)}` : "…"}</span>
        {mode === "overlay" && <label>opacity <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} /></label>}
        {mode === "overlay" && (
          <label>
            blend{" "}
            <select style={{ color: "#fff", background: "#333", border: "1px solid #666" }} value={blend} onChange={(e) => setBlend(e.target.value as React.CSSProperties["mixBlendMode"])}>
              {["normal", "multiply", "difference", "exclusion", "screen"].map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
        )}
        {mode === "split" && <label>seam <input type="range" min={0} max={100} value={seam} onChange={(e) => setSeam(+e.target.value)} /></label>}
        {mode === "difference" && <span>black = the design and the code agree</span>}
      </div>
    </>
  );
}

export const withOnion: Decorator = (Story, context) => {
  const param = context.parameters.onion as OnionParam | undefined;
  const mode = (context.globals.onion as string) ?? "off";
  if (!param || mode === "off") return <Story />;
  return (
    <OnionStage param={param} mode={mode} args={context.args as Record<string, unknown>} globals={context.globals}>
      <Story />
    </OnionStage>
  );
};
