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
 *   values    allowed values for a prop whose type is wider than the kit's
 *             CSS answers (a string the stylesheet only knows four of)
 *   omit      prop -> why it is not in scenes
 *
 * What never goes in a scene, for every kind: a link (`href`), a style or a
 * class name, a callback, a URL, markup. A scene says what the kit can draw.
 */

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
  row: shell("row", "children in one line, no wrapping"),
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
    values: { ratio: ["16 / 9", "4 / 3", "1 / 1", "3 / 4", "21 / 9"] },
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
    omit: { live: "a preview should not speak up the moment it is drawn" },
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
};
