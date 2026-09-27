import type { Meta, StoryObj } from "@storybook/react-vite";

const LAYERS: [string, string][] = [
  ["reset", "normalize UA differences"],
  ["tokens", "custom property declarations only, no rules"],
  ["elements", "bare element defaults — h1, p, a, table"],
  ["shells", "layout containers: stack, row, grid, split, sidebar, center"],
  ["components", "named UI components"],
  ["compositions", "page-level arrangement"],
  ["utilities", "single-purpose escape hatches, used sparingly"],
];

const meta = {
  title: "03 Foundations/01 Layers",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Order: Story = {
  name: "Cascade order",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <h1 className="tk-doc-title">Cascade layers</h1>
      <p className="tk-doc-note">
        A rule's layer decides who wins, not its selector. Later layers beat
        earlier ones regardless of specificity, so a composition can adjust a
        component and a component can adjust a shell without anyone escalating
        selectors or reaching for <code>!important</code>. Inside the layers
        most selectors are wrapped in <code>:where()</code>, which contributes
        zero specificity — overriding anything in the kit takes a plain
        selector.
      </p>

      {LAYERS.map(([name, role], i) => (
        <div className="tk-row" key={name} style={{ gridTemplateColumns: "3rem 12rem 1fr" }}>
          <span className="tk-value">{i + 1}</span>
          <code>@layer {name}</code>
          <span className="tk-value">{role}</span>
        </div>
      ))}

      <p className="tk-doc-spec">
        Declared once in <b>src/css/00-layers.css</b>, which must be the first
        CSS the browser sees — the ordering statement has to arrive before any
        layer is populated.
      </p>

      <p className="tk-doc-note" style={{ marginBlockStart: "var(--tk-space-5)" }}>
        The one thing that beats all of it: an unlayered rule. Any stylesheet
        that does not opt into a layer outranks every layered rule in the
        document whatever its specificity. That is worth knowing before
        embedding the kit somewhere that injects its own reset.
      </p>
    </div>
  ),
};
