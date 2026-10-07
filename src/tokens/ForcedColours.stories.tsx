import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "../react/primitives/Alert";
import { Button } from "../react/primitives/Button";
import { Chip } from "../react/primitives/Chip";
import { ChoiceCardGroup } from "../react/primitives/ChoiceCard";
import { Field } from "../react/primitives/Field";
import { Sub } from "./doc";

/* Forced colours: what survives when the reader's own colours replace the
   pack's. Documentation, not a component, so no `component` on the meta. */
const meta = {
  title: "02 Tokens/01 Colour/06 Forced colours",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Windows contrast themes (forced colours) replace every colour on the page with a few the reader chose. Text, borders and outlines survive in those colours; fills, shadows and gradients do not. So a control whose shape is a fill needs a border (a transparent one is enough: forced colours repaint it), and a focus ring has to be an outline. tools/forced-colors-gate.mjs checks both in every story. To see it: DevTools, Rendering, Emulate CSS media feature forced-colors: active; or Windows Settings, Accessibility, Contrast themes.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The controls a reader operates, as forced colours will redraw them. */
export const Sheet: Story = {
  name: "What survives",
  render: () => (
    <div data-shell="stack" data-gap="6" style={{ maxInlineSize: "44rem" }}>
      <div data-shell="stack" data-gap="2">
        <h1 style={{ margin: 0, fontSize: "var(--tk-size-2xl)" }}>Forced colours</h1>
        <p style={{ margin: 0, color: "var(--tk-text-secondary)" }}>
          Turn on forced colours (DevTools, Rendering, Emulate CSS media feature forced-colors: active) and
          everything below keeps its shape: each control has a border, each mark that carries state (a current
          dot, a checked card) has one too, and focus is an outline. Tab through to see the ring.
        </p>
      </div>

      <section data-shell="stack" data-gap="3">
        <Sub>Buttons: solid, outline, quiet and danger all carry a border, transparent where it does not show.</Sub>
        <div data-shell="inline" data-gap="3">
          <Button>Save changes</Button>
          <Button variant="outline">Preview</Button>
          <Button variant="quiet">Cancel</Button>
          <Button tone="danger">Delete</Button>
        </div>
      </section>

      <section data-shell="stack" data-gap="3">
        <Sub>Fields: the boundary is the 1.4.11 line, which forced colours keep.</Sub>
        <Field label="Email address" type="email" autoComplete="email" />
        <Field label="Role" control="select" options={[{ value: "", label: "Choose a role" }, { value: "design", label: "Design" }]} />
      </section>

      <section data-shell="stack" data-gap="3">
        <Sub>Choices and chips: checked is a thicker border, not only a fill.</Sub>
        <ChoiceCardGroup
          legend="Plan"
          name="forced-plan"
          defaultValue="team"
          columns={2}
          options={[
            { value: "solo", title: "Solo", description: "One seat." },
            { value: "team", title: "Team", description: "Up to ten seats." },
          ]}
        />
        <div data-shell="inline" data-gap="2">
          <Chip interactive pressed>Pressed</Chip>
          <Chip interactive>Not pressed</Chip>
        </div>
      </section>

      <section data-shell="stack" data-gap="3">
        <Sub>Status: the title and the words carry it; the colour is a second channel.</Sub>
        <Alert status="warning" title="Your session ends in five minutes">Save your work to keep it.</Alert>
        <p style={{ margin: 0 }}>
          A <a href="#forced-colours">link in running text</a> keeps its underline and takes the reader's link colour.
        </p>
      </section>
    </div>
  ),
};
