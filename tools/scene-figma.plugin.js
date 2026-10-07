/* Scene -> Figma. Runs inside Figma (use_figma / a plugin), with SCENE, OPTS
   and IDS filled in by tools/scene-figma.mjs. Draws a clean scene from the
   kit's own Figma components and variables: a part is an instance of its
   component with its properties set, a shell is an auto-layout frame whose
   gap is bound to the space variable, and the card is the Card component
   detached, so its fill, stroke, corner and padding stay bound to the pack.
   The result is a frame on the Scenes page, named for the scene, ready for
   the onion check to lay over the Storybook scene. */

const SCENE = __SCENE__;
const OPTS = __OPTS__;
const IDS = __IDS__;
const KINDS = __KINDS__;

const vars = await figma.variables.getLocalVariablesAsync();
const V = (name) => {
  const v = vars.find((x) => x.name === name);
  if (!v) throw new Error("No variable " + name);
  return v;
};
const collections = await figma.variables.getLocalVariableCollectionsAsync();
/* The mode a collection takes for this scene: the pack's own when the
   collection has one (tk, tk-density), its default when it does not. */
const modeOf = (col) => (col.modes.find((m) => m.name === SCENE.brand) ?? col.modes.find((m) => m.modeId === col.defaultModeId)).modeId;
/* A variable's number in the scene's mode, following aliases. */
async function num(name) {
  let v = V(name);
  for (let i = 0; i < 5; i++) {
    const col = collections.find((c) => c.id === v.variableCollectionId);
    const val = v.valuesByMode[modeOf(col)];
    if (typeof val === "number") return val;
    v = await figma.variables.getVariableByIdAsync(val.id);
  }
  throw new Error("Unresolved " + name);
}
const SPACE = {};
for (let i = 0; i <= 9; i++) SPACE[i] = await num("space/" + i);
const GUTTER = await num("gutter");
const REM = 16;

const styles = await figma.getLocalTextStylesAsync();
const S = (n) => {
  const s = styles.find((x) => x.name === "tk/" + n);
  if (!s) throw new Error("No text style tk/" + n);
  return s;
};
const sets = {};
for (const [k, id] of Object.entries(IDS)) sets[k] = await figma.getNodeByIdAsync(id);
const iconsPage = figma.root.children.find((p) => p.name === "Icons");
await iconsPage.loadAsync();
const iconComp = (n) => iconsPage.findOne((c) => c.type === "COMPONENT" && c.name === "Icon/" + n);

/* One ch of the body face, measured the way the browser measures it (the
   width of a 0), because the center shell's measures are in ch. */
const zero = figma.createText();
await figma.loadFontAsync(S("body").fontName);
await zero.setTextStyleIdAsync(S("body").id);
zero.characters = "0000000000"; /* ten, so a rounded box width doesn't round the ch */
const CH = zero.width / 10;
zero.remove();

const paint = (name) => figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", V(name));
function variant(set, want) {
  if (set.type === "COMPONENT") return set;
  const target = { ...set.defaultVariant.variantProperties, ...want };
  return set.children.find((c) => Object.entries(target).every(([k, v]) => c.variantProperties[k] === v)) ?? set.defaultVariant;
}
function setProps(inst, values) {
  const defs = inst.componentProperties;
  const out = {};
  for (const [short, v] of Object.entries(values)) {
    const key = Object.keys(defs).find((k) => k.split("#")[0] === short);
    if (key && v !== undefined) out[key] = v;
  }
  inst.setProperties(out);
}
async function text(str, style, colour = "text/primary") {
  const t = figma.createText();
  const st = S(style);
  await figma.loadFontAsync(st.fontName);
  await t.setTextStyleIdAsync(st.id);
  t.characters = str;
  t.fills = [paint(colour)];
  return t;
}
async function setText(node, str) {
  await figma.loadFontAsync(node.fontName);
  node.characters = str;
}
function frame(name, mode, gap) {
  const f = figma.createFrame();
  f.name = name;
  f.fills = [];
  f.clipsContent = false;
  f.layoutMode = mode;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  if (gap != null) {
    f.itemSpacing = SPACE[gap];
    f.setBoundVariable("itemSpacing", V("space/" + gap));
  }
  return f;
}
/* Width: "fill" stretches across the parent, a number is fixed, "hug" is the content's own. */
function size(n, w) {
  if (w === "fill") n.layoutSizingHorizontal = "FILL";
  else if (w === "hug") {
    if ("layoutSizingHorizontal" in n) n.layoutSizingHorizontal = "HUG";
  } else if (typeof w === "number") {
    n.layoutSizingHorizontal = "FIXED";
    n.resize(w, n.height);
  }
  if (n.type === "TEXT" && w !== "hug") n.textAutoResize = "HEIGHT";
}
const ALIGN = { start: "MIN", center: "CENTER", end: "MAX", stretch: "MIN" };
const JUSTIFY = { start: "MIN", center: "CENTER", end: "MAX", between: "SPACE_BETWEEN" };
const LOOK_BY_LEVEL = { 1: "title", 2: "heading-l", 3: "heading-m", 4: "heading-s", 5: "heading-xs", 6: "eyebrow" };

/* Prototypes from the Card component: its title and body text carry the
   card's own styles, and its footer frame its rule and padding. */
const cardProto = variant(sets.Card, { Variant: "default", Interactive: "false", State: "default" }).createInstance().detachInstance();
const PROTO = {
  title: cardProto.findOne((n) => n.name === "title"),
  body: cardProto.findOne((n) => n.name === "body"),
  footer: cardProto.findOne((n) => n.name === "footer"),
};
cardProto.visible = false;

/* Build one part. `w` is the room it has, in pixels, for anything that has
   to compute a width (a grid's columns, a sidebar's main column). */
async function part(n, w, parentKind) {
  const k = n.kind;
  const name = (KINDS[k] && KINDS[k].name) || k;
  const kids = n.children || [];

  /* The center shell caps its own width at a measure and sits in the middle
     of what it is given: a full-width wrapper, centred, around a stack at
     the measure. */
  if (k === "center") {
    const outer = frame(name, "VERTICAL", null);
    outer.counterAxisAlignItems = "CENTER";
    const max = n.width === "narrow" ? 44 * CH : n.width === "wide" ? 80 * REM : 53 * CH;
    /* border-box: the measure includes the shell's gutter padding. */
    const inner = await part({ ...n, kind: "stack", align: n.align ?? "stretch" }, Math.min(w, max) - 2 * GUTTER, "center");
    inner.name = "Measure";
    inner.paddingLeft = inner.paddingRight = GUTTER;
    inner.setBoundVariable("paddingLeft", V("gutter"));
    inner.setBoundVariable("paddingRight", V("gutter"));
    outer.appendChild(inner);
    size(inner, Math.min(w, max));
    return outer;
  }

  if (["stack", "row", "inline", "split", "sidebar", "grid"].includes(k)) {
    const gap = n.gap ?? 4;
    const g = SPACE[gap];
    const vertical = k === "stack";
    const f = frame(name, vertical ? "VERTICAL" : "HORIZONTAL", gap);
    if (k === "inline" || k === "grid" || k === "sidebar") {
      f.layoutWrap = "WRAP";
      f.counterAxisSpacing = g;
      f.setBoundVariable("counterAxisSpacing", V("space/" + gap));
    }
    /* Each shell's own default, as its CSS has it: a stack, grid and sidebar
       stretch (top-aligned across), a row sits at the start, an inline and a
       split centre. */
    const align = n.align ?? ({ stack: "stretch", grid: "stretch", sidebar: "stretch", row: "start" }[k] ?? "center");
    f.counterAxisAlignItems = ALIGN[align];
    if (n.justify) f.primaryAxisAlignItems = JUSTIFY[n.justify];

    let widths;
    if (k === "split") widths = kids.map(() => (w - g) / 2);
    else if (k === "sidebar") {
      /* The CSS: the rail's basis is 18rem and grows by 1, the body's basis is
         0 and grows by 999 with a floor of 55%. The body takes almost all the
         free room; at its floor the rail takes the rest. Too narrow for both
         and they wrap, one above the other. */
      const side = 18 * REM;
      if (side + g + 0.55 * w > w) widths = kids.map(() => w);
      else {
        const free = w - side - g;
        let body = (free * 999) / 1000;
        if (body < 0.55 * w) body = 0.55 * w;
        const rail = w - g - body;
        widths = n.side === "end" ? [body, rail] : [rail, body];
      }
    } else if (k === "grid") {
      const min = { 1: w, 2: 18 * REM, 3: 14 * REM, 4: 11 * REM }[n.cols ?? 2] ?? 16 * REM;
      const fit = Math.max(1, Math.floor((w + g) / (Math.min(min, w) + g)));
      const cols = Math.min(fit, kids.length || 1);
      widths = kids.map(() => (w - g * (cols - 1)) / cols);
    } else widths = kids.map(() => (vertical ? w : null));

    for (let i = 0; i < kids.length; i++) {
      const child = await part(kids[i], widths[i] ?? w, k);
      f.appendChild(child);
      if ((vertical && (align === "stretch" || kids[i].kind === "divider")) || kids[i].full) size(child, "fill");
      else if (k === "split" || k === "sidebar" || k === "grid") size(child, widths[i]);
    }
    return f;
  }

  switch (k) {
    case "card": {
      const c = variant(sets.Card, { Variant: n.variant ?? "default", Interactive: "false", State: "default" }).createInstance().detachInstance();
      c.name = "Card";
      for (const child of [...c.children]) child.remove();
      const inner = w - c.paddingLeft - c.paddingRight;
      for (const kid of kids) {
        const child = await part(kid, inner, "card");
        c.appendChild(child);
        size(child, "fill");
      }
      return c;
    }
    case "card-header": {
      const f = frame("Card header", "VERTICAL", 1);
      if (n.eyebrow) {
        const e = variant(sets.Eyebrow, { Emphasis: "default" }).createInstance();
        setProps(e, { Label: n.eyebrow });
        f.appendChild(e);
      }
      for (const kid of kids) {
        const child = await part(kid, w, "card-header");
        f.appendChild(child);
        size(child, "fill");
      }
      if (n.subtitle) {
        const t = await text(n.subtitle, "small", "text/secondary");
        f.appendChild(t);
        size(t, "fill");
      }
      return f;
    }
    case "card-title":
    case "card-body": {
      const t = (k === "card-title" ? PROTO.title : PROTO.body).clone();
      t.visible = true;
      t.name = name;
      await setText(t, n.text ?? "");
      return t;
    }
    case "card-footer": {
      const f = PROTO.footer.clone();
      f.name = "Card footer";
      f.visible = true;
      for (const child of [...f.children]) child.remove();
      for (const kid of kids) {
        const child = await part(kid, w, "card-footer");
        f.appendChild(child);
      }
      return f;
    }
    case "heading":
      return text(n.text ?? "", n.look ?? LOOK_BY_LEVEL[n.level ?? 2]);
    case "text":
      return text(n.text ?? "", n.look ?? "body");
    case "eyebrow": {
      const e = variant(sets.Eyebrow, { Emphasis: n.emphasis ?? "default" }).createInstance();
      setProps(e, { Label: n.text ?? "" });
      return e;
    }
    case "media": {
      const ratio = (n.ratio ?? "16 / 9").replace(/\s*\/\s*/, "x");
      const p = variant(sets.Plate, { Ratio: ratio }).createInstance();
      return p;
    }
    case "divider": {
      const f = frame("Divider", "VERTICAL", null);
      f.paddingTop = f.paddingBottom = SPACE[5];
      f.setBoundVariable("paddingTop", V("space/5"));
      f.setBoundVariable("paddingBottom", V("space/5"));
      const r = figma.createRectangle();
      r.name = "rule";
      r.resize(w, 1);
      r.fills = [paint("line/default")];
      f.appendChild(r);
      r.layoutSizingHorizontal = "FILL";
      return f;
    }
    case "icon": {
      const i = variant(sets.Icon, { Size: n.size ?? "md" }).createInstance();
      const comp = iconComp(n.icon);
      if (comp) setProps(i, { Name: comp.id });
      return i;
    }
    case "button": {
      const b = variant(sets.Button, { Variant: n.variant ?? "solid", Size: n.size ?? "md", Tone: n.tone ?? "neutral", State: n.pressed ? "pressed" : "default" }).createInstance();
      const comp = n.icon ? iconComp(n.icon) : null;
      const trailing = n.iconPosition === "trailing";
      setProps(b, {
        Label: n.text ?? "",
        "Show leading": Boolean(comp) && !trailing,
        "Show trailing": Boolean(comp) && trailing,
        ...(comp ? { [trailing ? "Trailing" : "Leading"]: comp.id } : {}),
      });
      return b;
    }
    case "button-group": {
      const f = frame("Button group", "HORIZONTAL", 2);
      for (const kid of kids) f.appendChild(await part(kid, w, "button-group"));
      return f;
    }
    case "chip": {
      const c = variant(sets.Chip, { Emphasis: n.emphasis ?? "default", Pressed: n.pressed ? "true" : "false", Interactive: n.interactive ? "true" : "false", State: "default" }).createInstance();
      const comp = n.icon ? iconComp(n.icon) : null;
      setProps(c, { Label: n.text ?? "", "Show leading": Boolean(comp), ...(comp ? { Leading: comp.id } : {}) });
      return c;
    }
    case "field": {
      const state = n.readOnly ? "readonly" : n.error ? "invalid" : "default";
      const f = variant(sets.Field, { Control: n.control ?? "input", State: state }).createInstance();
      setProps(f, {
        Label: n.label ?? "Label",
        Value: n.control === "select" ? (n.options && n.options[0]) || "" : "",
        Hint: n.hint ?? "",
        "Show hint": Boolean(n.hint),
        Error: n.error ?? "",
        Required: Boolean(n.required),
        Optional: Boolean(n.optional),
      });
      return f;
    }
    case "alert": {
      const a = variant(sets.Alert, { Status: n.status ?? "info" }).createInstance();
      setProps(a, { Title: n.title ?? "", Body: n.text ?? "" });
      if (!n.title) {
        const t = a.findOne((x) => x.type === "TEXT" && x.name === "title");
        if (t) t.visible = false;
      }
      return a;
    }
    case "choice-group": {
      const f = frame("Choice group", "VERTICAL", 3);
      f.appendChild(await text(n.text ?? "", "small"));
      const grid = await part({ kind: "grid", cols: n.columns ?? 3, gap: 3, children: [] }, w, "choice-group");
      const min = { 1: w, 2: 18 * REM, 3: 14 * REM, 4: 11 * REM }[n.columns ?? 3];
      const fit = Math.max(1, Math.floor((w + SPACE[3]) / (Math.min(min, w) + SPACE[3])));
      const cols = Math.min(fit, kids.length || 1);
      const cw = (w - SPACE[3] * (cols - 1)) / cols;
      for (const kid of kids) {
        const c = variant(sets.ChoiceCard, { State: "unchecked" }).createInstance();
        const set = async (nm, v) => {
          const t = c.findOne((x) => x.type === "TEXT" && x.name === nm);
          if (!t) return;
          if (v) await setText(t, v);
          else t.visible = false;
        };
        await set("title", kid.text ?? "Option");
        await set("meta", kid.meta);
        await set("description", kid.description);
        grid.appendChild(c);
        size(c, cw);
      }
      f.appendChild(grid);
      size(grid, "fill");
      return f;
    }
    default:
      return frame(name, "VERTICAL", null);
  }
}

/* The stage: the scene's surface, padded as data-tk="scene" is. */
let page = figma.root.children.find((p) => p.name === "Scenes");
if (!page) {
  page = figma.createPage();
  page.name = "Scenes";
}
await figma.setCurrentPageAsync(page);
const old = page.findOne((n) => n.name === "Scene/" + SCENE.title && n.type === "FRAME");
if (old) old.remove();
const stage = frame("Scene/" + SCENE.title, "VERTICAL", null);
/* The scene's pack, as the frame's variable modes. */
for (const col of collections) {
  if (col.modes.some((m) => m.name === SCENE.brand)) stage.setExplicitVariableModeForCollection(col, modeOf(col));
}
stage.fills = [paint("surface/base")];
stage.paddingTop = stage.paddingBottom = SPACE[6];
stage.setBoundVariable("paddingTop", V("space/6"));
stage.setBoundVariable("paddingBottom", V("space/6"));
stage.paddingLeft = stage.paddingRight = GUTTER;
stage.setBoundVariable("paddingLeft", V("gutter"));
stage.setBoundVariable("paddingRight", V("gutter"));
stage.counterAxisSizingMode = "FIXED";
stage.resize(OPTS.width, 100);
stage.x = OPTS.x ?? 0;
stage.y = OPTS.y ?? 0;
const inner = OPTS.width - 2 * GUTTER;
const root = await part(SCENE.root, inner, null);
stage.appendChild(root);
size(root, "fill");
cardProto.remove();
return { id: stage.id, w: stage.width, h: Math.round(stage.height) };
