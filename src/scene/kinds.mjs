/**
 * Which kit part each scene kind is. The only hand-kept part of the scene
 * vocabulary: the options a kind takes and their allowed values are read out
 * of the component's own prop types by tools/gen-scene-vocabulary.mjs, so a
 * new prop or value reaches scenes without anyone editing a list here.
 *
 * Every prop a component declares in this repo is either in the vocabulary
 * or named under `omit` with the reason; a new prop that is neither stops the
 * generator until it is sorted. A DOM attribute (`type`, `readOnly`) is out
 * unless `include` names it.
 *
 *   from      the file and the export (or type) to read the props from
 *   text      where a node's words go: "children", a prop name, or absent
 *   children  true for any kind, a list for only those kinds, or absent
 *   within    the kinds this one may sit inside (absent: anywhere)
 *   rename    scene name for a prop whose own name means something else here
 *   textProps ReactNode props that take words in a scene
 *   iconProps ReactNode props that take one of the kit's icons by name
 *   numbers   number props that are measures, not counts (a longitude, a zoom):
 *             kept with their decimals instead of rounded to a whole number
 *   values    allowed values for a prop whose type is wider than the kit's
 *             CSS answers (a string the stylesheet only knows four of)
 *   omit      prop -> why it is not in scenes
 *
 * What never goes in a scene, for every kind: a link (`href`), a style or a
 * class name, a callback, a URL, markup. A scene says what the kit can draw.
 */

import { SECTION_TYPES, SECTION_VARIANTS } from "./sections.mjs";

const SHELL_OMIT = {
  as: "the element is the shell's business",
  kind: "fixed by the scene kind",
  container: "a query container is an implementation detail of a layout",
  className: "no class names in a scene",
};

const shell = (kind, about) => ({
  name: kind[0].toUpperCase() + kind.slice(1),
  from: ["src/react/shells/Shell.tsx", "Shell"],
  shell: kind,
  children: true,
  omit: SHELL_OMIT,
  about,
});

export const KIND_MAP = {
  stack: shell("stack", "children in a column"),
  row: shell("row", "children side by side, wrapping to a new line when they run out of room"),
  inline: shell("inline", "children in a line that wraps: a set of tags"),
  grid: shell("grid", "children in up to cols columns that fold on a narrow width; ratio makes two unequal columns"),
  split: shell("split", "two equal halves"),
  sidebar: shell("sidebar", "a narrow first child beside a wide second; side end puts the narrow one last"),
  center: shell("center", "a centred measure"),

  card: {
    name: "Card",
    from: ["src/react/primitives/Card.tsx", "Card"],
    children: true,
    omit: { as: "the element is the card's business", interactive: "a scene has no links to make a card clickable", fx: "motion is the page's, not the scene's" },
    about: "a surface; holds a card-header or card-title, card-body, card-footer and any other parts",
  },
  "card-header": {
    name: "Card header",
    from: ["src/react/primitives/Card.tsx", "CardHeader"],
    children: ["card-title"],
    within: ["card"],
    textProps: ["eyebrow", "subtitle"],
    omit: { action: "a control at the header's end needs behaviour a scene does not carry" },
    about: "the top of a card: an eyebrow above its card-title and a subtitle under it",
  },
  "card-title": {
    name: "Card title",
    from: ["src/react/primitives/Card.tsx", "CardTitle"],
    text: "children",
    omit: { as: "the level follows the card", href: "no links in a scene" },
    about: "a card's heading",
  },
  "card-body": { name: "Card body", from: ["src/react/primitives/Card.tsx", "CardBody"], text: "children", about: "a card's paragraph" },
  "card-footer": { name: "Card footer", from: ["src/react/primitives/Card.tsx", "CardFooter"], children: true, about: "the foot of a card, usually its buttons" },

  heading: {
    name: "Heading",
    from: ["src/react/primitives/Heading.tsx", "Heading"],
    text: "children",
    rename: { text: "look" },
    about: "a heading outside a card; level is its place in the outline, look how it appears when that differs",
  },
  text: {
    name: "Text",
    element: "p",
    text: "children",
    props: { look: ["src/react/primitives/Heading.tsx", "TextStyle"] },
    about: "a paragraph; look sets a text style (lead, small, caption, metric…)",
  },
  eyebrow: { name: "Eyebrow", from: ["src/react/primitives/Eyebrow.tsx", "Eyebrow"], text: "children", about: "a small uppercase label above a heading" },
  media: {
    name: "Media",
    from: ["src/react/primitives/Plate.tsx", "Plate"],
    values: { ratio: ["16 / 9", "4 / 3", "1 / 1", "3 / 4", "4 / 5", "21 / 9"] },
    omit: {
      crop: "a crop belongs to a photograph, and a scene has none",
      bleed: "flush edges depend on the parent's padding, which a scene does not set",
      seed: "the renderer seeds each plate from its place in the scene",
      stock: "a scene carries no photographs",
      src: "no URLs in a scene",
      category: "label says what the picture stands in for",
      placement: "the stock chip belongs to stock photographs",
      priority: "loading order is the page's business",
      fx: "motion is the page's, not the scene's",
      style: "no styles in a scene",
    },
    about: "where a picture goes, drawn in the pack; label says what it stands in for",
  },
  divider: { name: "Divider", element: "hr", about: "a rule between sections" },
  icon: {
    name: "Icon",
    from: ["src/react/primitives/Icon.tsx", "Icon"],
    rename: { name: "icon" },
    about: "an icon on its own; give it a label only when it is the only thing saying what it means",
  },
  button: {
    name: "Button",
    from: ["src/react/primitives/Button.tsx", "Button"],
    text: "children",
    iconProps: ["icon"],
    omit: {
      as: "a button in a scene is a button",
      href: "no links in a scene",
      reason: "a disabled button's reason needs a disabled state a scene does not carry",
      leading: "icon and iconPosition say the same with a name",
      trailing: "icon and iconPosition say the same with a name",
      type: "a scene does not submit",
      busyLabel: "a busy state is behaviour a scene does not carry",
    },
    about: "a button; tone danger for destructive actions; with an icon and no text it is icon-only",
  },
  "button-group": {
    name: "Button group",
    from: ["src/react/primitives/ButtonGroup.tsx", "ButtonGroup"],
    children: ["button"],
    text: "label",
    omit: { actions: "the group's buttons are its children" },
    about: "two or three related buttons in a row (the rest behind More); its text is the group's accessible name",
  },
  chip: {
    name: "Chip",
    from: ["src/react/primitives/Chip.tsx", "Chip"],
    text: "children",
    rename: { leading: "icon" },
    iconProps: ["leading"],
    about: "a small label: a tag, a status; interactive and pressed make it a filter",
  },
  field: {
    name: "Field",
    from: ["src/react/primitives/Field.tsx", "Field"],
    include: ["type", "readOnly"],
    values: { type: ["text", "email", "password", "number", "search", "tel", "url", "date"] },
    omit: {
      reveal: "the show and hide button is on for every password field",
      children: "a custom control is code, not a scene",
    },
    about: "a labelled input, textarea or select; chars sizes it to the answer; options are a select's choices",
  },
  alert: {
    name: "Alert",
    from: ["src/react/primitives/Alert.tsx", "Alert"],
    text: "children",
    omit: {
      live: "a preview should not speak up the moment it is drawn",
      action: "an Undo or a Retry needs behaviour a scene does not carry",
    },
    about: "a message with a status",
  },
  "choice-group": {
    name: "Choice group",
    from: ["src/react/primitives/ChoiceCard.tsx", "ChoiceCardGroup"],
    children: ["choice"],
    text: "legend",
    textProps: ["hint"],
    omit: {
      name: "the renderer names the group",
      options: "the group's choices are its children",
      defaultValue: "a scene shows the choices, not a selection",
      value: "a scene shows the choices, not a selection",
      onChange: "no behaviour in a scene",
    },
    about: "a question answered by choice cards; its text is the question",
  },
  choice: {
    name: "Choice",
    from: ["src/react/primitives/ChoiceCard.tsx", "ChoiceCardOption"],
    within: ["choice-group"],
    text: "title",
    textProps: ["description", "meta"],
    omit: { value: "the renderer gives each choice its value" },
    about: "one choice card: its text is the option's name; description and meta (a price, Recommended) are optional",
  },

  pagination: {
    name: "Pagination",
    from: ["src/react/primitives/Pager.tsx", "Pager"],
    omit: { href: "no links in a scene: the renderer gives each page its own address" },
    about: "the way through a long list: worded links back and on, and with numbers the pages between them, each the same round size",
  },
  map: {
    name: "Map",
    from: ["src/react/scene/SceneMap.tsx", "SceneMap"],
    numbers: ["longitude", "latitude", "zoom"],
    about: "a place on a map, drawn by the kit's Map on the pack's basemap; label says what it shows, marker pins the centre",
  },

  video: {
    name: "Video",
    from: ["src/react/primitives/VideoPlayer.tsx", "VideoPlayer"],
    text: "title",
    values: { ratio: ["16 / 9", "4 / 3", "1 / 1", "9 / 16", "21 / 9"] },
    omit: {
      poster: "the renderer draws the poster as a plate; posterLabel says what it shows",
      src: "no URLs in a scene",
      embed: "no URLs in a scene",
      transcriptHref: "no links in a scene",
    },
    about: "a video as its poster with a play button; its text is the video's title, posterLabel what the poster shows, duration its running time",
  },
  quote: {
    name: "Quote",
    from: ["src/react/primitives/Quote.tsx", "Quote"],
    text: "text",
    omit: { portrait: "a portrait is a picture, and a scene draws pictures as media" },
    about: "a quotation and who said it: its text is the words (no quotation marks), name, role and organisation the speaker; pull for an article, testimonial in a card",
  },

  table: {
    name: "Table",
    from: ["src/react/primitives/DataTable.tsx", "DataTable"],
    text: "caption",
    children: ["table-row"],
    fixed: { rowHeaders: "flag" },
    omit: {
      columns: "the first table-row is the header",
      rows: "the rows are the table's table-row children",
      rowHeader: "rowHeaders says the first column heads its row",
    },
    about: "data that is a table: its text is the caption; the first table-row holds the column headings, each later one a row; rowHeaders makes the first cell of each row its heading",
  },
  "table-row": {
    name: "Table row",
    element: "tr",
    children: ["table-cell"],
    within: ["table"],
    about: "one row of a table: its cells, in column order",
  },
  "table-cell": {
    name: "Table cell",
    element: "td",
    text: "children",
    within: ["table-row"],
    about: "one cell's words",
  },

  /* A whole section of a page from the wireframe library (sections.mjs): a
     type and a layout, and the words it should carry. It expands into the
     parts above before the scene is sanitized, so it draws nothing the kit
     would not; written with its own children, it is drawn as written. */
  section: {
    name: "Section",
    element: "section",
    children: true,
    fixed: {
      type: SECTION_TYPES,
      variant: SECTION_VARIANTS,
      heading: "text",
      body: "text",
      eyebrow: "text",
      actions: "list",
      items: "integer",
      media: "text",
      label: "text",
    },
    about: "a whole section of a page from the wireframe library: give its type and variant, and its heading, body, eyebrow, actions (labels), items (how many) and media (what the picture is); it is drawn from the kit's parts",
  },
};
