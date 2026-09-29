import { createElement as h, useEffect, useState } from "react";
import { AddonPanel } from "storybook/internal/components";
import { addons, types, useChannel, useGlobals, useParameter } from "storybook/manager-api";
import { create } from "storybook/theming";
import keys from "../figma/keys.json";
import meta from "../figma/meta.json";

/* The sidebar carries the wordmark, so the kit's name is on every page of the
   Storybook and not only on the one that plays the animation. */
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "token kit",
    brandImage: "wordmark.svg",
    brandTarget: "_self",
  }),
});

/* Storybook to Figma. A story that has a Figma skin says which component it is
   (parameters.onion.component), and figma/keys.json says which Figma node that is:
   one toolbar button, on every such story, opens that node in the file. It is the
   same pointer the addon-designs convention calls `design`, kept in one map rather
   than repeated in every story. The other direction (Figma to code) is written into
   each component's documentation link and description by the Figma build.

   Everything below uses createElement, not JSX: the manager bundle is built with
   the classic runtime, and a JSX element there needs React in scope. */
const FILE = keys.file;
const figmaUrl = (node: string) => `https://www.figma.com/design/${FILE}/?node-id=${node.replace(":", "-")}`;

function FigmaLink() {
  const onion = useParameter<{ component?: string }>("onion", {});
  const node = onion.component ? (keys.components as Record<string, string>)[onion.component] : undefined;
  if (!node) return null;
  return h(
    "a",
    {
      href: figmaUrl(node),
      target: "_blank",
      rel: "noreferrer",
      title: `Open ${onion.component} in Figma`,
      style: { alignSelf: "center", padding: "4px 10px", font: "600 12px/1.2 system-ui, sans-serif", color: "inherit", textDecoration: "none", border: "1px solid currentColor", borderRadius: 999, opacity: 0.85 },
    },
    "Figma ↗",
  );
}

/* ---------------------------------------------------------------- panels */

const ink = { font: "13px/1.5 system-ui, sans-serif", padding: 16, color: "inherit" } as const;
const mono = { fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12 } as const;
const muted = { opacity: 0.65 } as const;
const chip = (on: boolean) => ({ padding: "4px 10px", border: "1px solid currentColor", borderRadius: 999, background: on ? "currentColor" : "transparent", cursor: "pointer", font: "600 12px/1.2 system-ui, sans-serif", color: "inherit" }) as const;

type Meta = { node: string; figma: string; source: string | null; skinDir: string | null; skinPulledAt: string | null; sourceUpdatedAt: string | null; stale: boolean; check: { skins: number; mean: number; worst: number; checkedAt: string } | null };
const components = meta.components as unknown as Record<string, Meta>;

const when = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 864e5);
  const ago = days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  return `${d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · ${ago}`;
};

const row = (k: string, v: unknown) => h("tr", { key: k }, h("th", { style: { textAlign: "left", fontWeight: 500, padding: "3px 24px 3px 0", whiteSpace: "nowrap", ...muted } }, k), h("td", { style: { padding: "3px 0" } }, v as never));

function DesignPanel({ active }: { active: boolean }) {
  const onion = useParameter<{ component?: string }>("onion", {});
  const [globals, updateGlobals] = useGlobals();
  const [live, setLive] = useState<{ component: string; file: string; skin: number[] | null; live: number[] | null } | null>(null);
  useChannel({ "tokenkit/onion": setLive });
  const name = onion.component;
  const m = name ? components[name] : undefined;
  const mode = (globals.onion as string) ?? "off";
  const skin = live && live.component === name ? live : null;

  if (!name || !m) return h(AddonPanel, { active }, h("div", { style: { ...ink, ...muted } }, "This story has no frame in the Figma file. Stories with an Onion skin story do."));

  const controls = h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 10, minWidth: 260 } },
    h("div", { style: { fontWeight: 600 } }, "Onion skin"),
    h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, ["off", "overlay", "difference", "split"].map((v) => h("button", { key: v, type: "button", style: chip(mode === v), onClick: () => updateGlobals({ onion: v }) }, h("span", { style: { mixBlendMode: "normal", filter: mode === v ? "invert(1)" : undefined } }, v)))),
    mode === "overlay" &&
      h("label", { style: { display: "flex", gap: 8, alignItems: "center" } }, "opacity", h("input", { type: "range", min: 0, max: 100, value: Number(globals.onionOpacity ?? 60), onChange: (e: { target: { value: string } }) => updateGlobals({ onionOpacity: +e.target.value }) }), h("span", { style: mono }, `${globals.onionOpacity ?? 60}%`)),
    mode === "overlay" &&
      h("label", { style: { display: "flex", gap: 8, alignItems: "center" } }, "blend", h("select", { value: String(globals.onionBlend ?? "normal"), onChange: (e: { target: { value: string } }) => updateGlobals({ onionBlend: e.target.value }) }, ["normal", "multiply", "difference", "exclusion", "screen"].map((b) => h("option", { key: b }, b)))),
    mode === "split" &&
      h("label", { style: { display: "flex", gap: 8, alignItems: "center" } }, "seam", h("input", { type: "range", min: 0, max: 100, value: Number(globals.onionSeam ?? 50), onChange: (e: { target: { value: string } }) => updateGlobals({ onionSeam: +e.target.value }) }), h("span", { style: mono }, `${globals.onionSeam ?? 50}%`)),
    mode === "difference" && h("div", { style: muted }, "Black is where the design and the code agree."),
    skin && h("div", { style: { ...mono, ...muted } }, `${skin.file} · skin ${skin.skin ? skin.skin.join("×") : "…"} · live ${skin.live ? skin.live.join("×") : "…"}`),
  );

  const table = h(
    "table",
    { style: { borderCollapse: "collapse" } },
    h("tbody", null,
      row("Component", h("strong", null, name)),
      row("Figma frame", h("a", { href: figmaUrl(m.node), target: "_blank", rel: "noreferrer", style: { color: "inherit" } }, `node ${m.node} ↗`)),
      row("Design pulled", when(m.skinPulledAt)),
      row("Code updated", h("span", null, when(m.sourceUpdatedAt), m.stale ? h("strong", { style: { marginInlineStart: 8, color: "#b45309" } }, "newer than the design — re-pull") : null)),
      row("Last check", m.check ? h("span", null, `mean Δ ${m.check.mean} (worst ${m.check.worst}) over ${m.check.skins} skin${m.check.skins === 1 ? "" : "s"} · ${when(m.check.checkedAt)}`) : "—"),
      row("Source", h("code", { style: mono }, m.source ?? "—")),
    ),
  );

  const thumb = m.skinDir && live?.file && skin
    ? h("a", { href: figmaUrl(m.node), target: "_blank", rel: "noreferrer", title: "Open in Figma", style: { display: "block", flex: "0 0 auto" } },
        h("img", { alt: `${name} in Figma`, src: `/onion/${name}/${skin.file}`, style: { display: "block", maxWidth: 240, maxHeight: 160, border: "1px solid rgba(128,128,128,.4)", borderRadius: 6, background: "#fff", objectFit: "contain" } }))
    : null;

  return h(AddonPanel, { active }, h("div", { style: { ...ink, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" } }, thumb, table, controls));
}

type Token = { name: string; value: string; rules: number };
const isColor = (v: string) => /^(#|rgb|hsl|oklch|color\()/.test(v);
/* The Figma variable a token became: the CSS name minus --tk-, first dash to a slash. */
const figmaName = (css: string) => css.replace(/^--tk-/, "").replace("-", "/");
const group = (n: string) => n.replace(/^--tk-/, "").split("-")[0];

function TokensPanel({ active }: { active: boolean }) {
  const [data, setData] = useState<{ storyId: string; pack: string; density: string; root: string; tokens: Token[] } | null>(null);
  const [filter, setFilter] = useState("");
  const emit = useChannel({ "tokenkit/tokens": setData });
  useEffect(() => { if (active) emit("tokenkit/tokens-request"); }, [active]);
  if (!data) return h(AddonPanel, { active }, h("div", { style: { ...ink, ...muted } }, "Reading the tokens this story uses…"));
  const shown = data.tokens.filter((t) => t.name.includes(filter));
  const groups = [...new Set(shown.map((t) => group(t.name)))];
  return h(
    AddonPanel,
    { active },
    h("div", { style: ink },
      h("div", { style: { display: "flex", gap: 16, alignItems: "center", marginBottom: 12, flexWrap: "wrap" } },
        h("strong", null, `${data.tokens.length} tokens`),
        h("span", { style: muted }, `resolved under ${data.pack} · ${data.density} density · ${data.root}px root`),
        h("input", { placeholder: "filter", value: filter, onChange: (e: { target: { value: string } }) => setFilter(e.target.value), style: { marginInlineStart: "auto", padding: "3px 8px" } })),
      groups.map((g) =>
        h("section", { key: g, style: { marginBottom: 14 } },
          h("div", { style: { fontWeight: 600, textTransform: "capitalize", marginBottom: 4 } }, g),
          h("table", { style: { borderCollapse: "collapse", width: "100%" } }, h("tbody", null,
            shown.filter((t) => group(t.name) === g).map((t) =>
              h("tr", { key: t.name, style: { borderTop: "1px solid rgba(128,128,128,.25)" } },
                h("td", { style: { padding: "4px 12px 4px 0", width: 22 } }, isColor(t.value) ? h("span", { style: { display: "block", width: 16, height: 16, borderRadius: 4, background: t.value, border: "1px solid rgba(128,128,128,.5)" } }) : null),
                h("td", { style: { ...mono, padding: "4px 16px 4px 0" } }, t.name),
                h("td", { style: { ...mono, padding: "4px 16px 4px 0" } }, t.value || "—"),
                h("td", { style: { ...mono, padding: "4px 0", ...muted } }, `Figma: ${figmaName(t.name)}`)))))))),
  );
}

addons.register("tokenkit/figma-link", () => {
  addons.add("tokenkit/figma-link/tool", {
    type: types.TOOL,
    title: "Open in Figma",
    match: ({ viewMode }) => viewMode === "story" || viewMode === "docs",
    render: () => h(FigmaLink),
  });
  addons.add("tokenkit/design/panel", {
    type: types.PANEL,
    title: "Design",
    match: ({ viewMode }) => viewMode === "story",
    render: ({ active }) => h(DesignPanel, { active: !!active }),
  });
  addons.add("tokenkit/tokens/panel", {
    type: types.PANEL,
    title: "Tokens",
    match: ({ viewMode }) => viewMode === "story",
    render: ({ active }) => h(TokensPanel, { active: !!active }),
  });
});
