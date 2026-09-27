import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../react/primitives/Button";
import { Chip } from "../react/primitives/Chip";
import { Meter } from "../react/primitives/Meter";
import { Card, CardTitle, CardBody } from "../react/primitives/Card";

/**
 * Context, not props.
 *
 * Density, surface and pack are all ancestors. No component below is told
 * which one it is in, and none of them takes a prop for it.
 */
const Specimen = () => (
  <div data-shell="stack" data-gap="4">
    <div data-shell="inline" data-gap="2">
      <Button>Solid</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="quiet">Quiet</Button>
      <Chip>chip</Chip>
      <Chip emphasis="strong">strong</Chip>
    </div>
    <Meter label="Coverage" value={64} />
  </div>
);

const meta = {
  title: "03 Foundations/02 Context",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Density: Story = {
  name: "Density",
  render: () => (
    <div data-shell="stack" data-gap="6">
      <p className="tk-doc-note">
        One knob — <code>--tk-density</code>, a unitless number components
        multiply their own padding by. Set it on any ancestor. Nothing is
        threaded through a tree and no component knows what density it is in.
        The toolbar control sets the same attribute on the story wrapper.
      </p>
      {(["compact", "default", "comfortable"] as const).map((d) => (
        <div key={d}>
          <p className="tk-doc-sub">
            {d} · {d === "compact" ? "0.75" : d === "comfortable" ? "1.25" : "1.0"}
          </p>
          <div
            className="tk-stage"
            data-density={d === "default" ? undefined : d}
          >
            <Specimen />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Inverse: Story = {
  name: "Inverse plate",
  render: () => (
    <div data-shell="stack" data-gap="6">
      <p className="tk-doc-note">
        One attribute on the wrapper. The markup inside both plates below is
        byte-identical. Getting this wrong is subtle — remap only the text
        colour and quiet buttons render as invisible ink, which reads like a
        missing element rather than a contrast bug. The CI gate caught exactly
        that, which is why the inverse context is a complete slot set and why
        every pack has to define its own.
      </p>
      <div>
        <p className="tk-doc-sub">default surface</p>
        <div className="tk-stage">
          <Specimen />
        </div>
      </div>
      <div>
        <p className="tk-doc-sub">data-on="inverse"</p>
        <div className="tk-plate" data-on="inverse">
          <Specimen />
        </div>
      </div>
    </div>
  ),
};

export const Nesting: Story = {
  name: "Nested context",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <p className="tk-doc-note">
        Contexts compose. A compact card inside an inverted plate resolves both
        without either one knowing about the other, because a custom property is
        substituted per element against whatever it inherits.
      </p>
      <div className="tk-plate" data-on="inverse">
        <div data-shell="stack" data-gap="4">
          <Card>
            <CardTitle>Default density</CardTitle>
            <CardBody>Inside the inverted plate.</CardBody>
          </Card>
          <div data-density="compact">
            <Card>
              <CardTitle>Compact</CardTitle>
              <CardBody>Same card, one attribute up the tree.</CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  ),
};
