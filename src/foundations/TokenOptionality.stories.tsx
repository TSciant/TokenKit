import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page, Sub, useTokenReader, type ContextGlobals } from "../tokens/doc";
import { Button } from "../react/primitives/Button";
import { Card, CardBody, CardTitle } from "../react/primitives/Card";
import { Chip } from "../react/primitives/Chip";

/**
 * Token optionality - axes on the toolbar, never on the component.
 *
 * Pack, density, and root font size are cascade context. Flip them; the
 * specimens below re-resolve. That is the opposite of a variant prop.
 */

const meta = {
  title: "03 Foundations/07 Token optionality",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Pack, density, and root live in the Storybook toolbar. Components read the cascade - flip an axis and every specimen updates without a prop change. Use for: Proving pack, density, and root cascade across specimens without forking components or adding theme props. Don't use for: Per-component theme knobs that bypass the toolbar axes, or treating optionality as a reason to hard-code values in JSX.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const SLOTS = [
  "--tk-space-4",
  "--tk-size-base",
  "--tk-duration-base",
  "--tk-motion-transform",
  "--tk-action-fill",
  "--tk-scrim-aa",
] as const;

export const ToolbarAxes: Story = {
  name: "Toolbar axes",
  render: (_args, ctx) => {
    const g = ctx.globals as ContextGlobals;
    const { ref, read } = useTokenReader([g.pack, g.density, g.root]);

    return (
      <Page
        hostRef={ref}
        title="Token optionality"
        note={
          <>
            Use the toolbar: <b>Pack</b>, <b>Density</b>, <b>Root</b>. Nothing
            below takes those as props - the host decorator sets{" "}
            <code>data-brand</code> / <code>data-density</code> / document
            font-size, and tokens re-resolve.
          </>
        }
        spec={
          <>
            Current: pack <code>{g.pack}</code>, density{" "}
            <code>{g.density}</code>, root <code>{g.root}px</code>
          </>
        }
      >
        <Sub>Resolved slots</Sub>
        <div data-shell="stack" data-gap="1">
          {SLOTS.map((name) => (
            <div className="tk-row" key={name}>
              <code>{name}</code>
              <span className="tk-value" style={{ fontVariantNumeric: "tabular-nums" }}>
                {read(name) || "-"}
              </span>
            </div>
          ))}
        </div>

        <Sub>Specimens (same markup)</Sub>
        <div data-shell="stack" data-gap="4">
          <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
            <Button>Solid</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="quiet">Quiet</Button>
            <Chip>Filter</Chip>
          </div>
          <Card interactive style={{ maxInlineSize: "24rem" }}>
            <CardTitle as="h2">Density, pack, root</CardTitle>
            <CardBody>
              Padding, type, and action fill all came from the cascade. Change
              the toolbar - not this story&apos;s props.
            </CardBody>
          </Card>
        </div>

        <Sub>Motion contract (JS bridge)</Sub>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          <code>--tk-motion-transform</code> above is what Motion FX and the
          Motion library both read via <code>motion-tokens.ts</code>. Flip the
          pack and the curve stays single-sourced - see Tokens / Motion.
        </p>
      </Page>
    );
  },
};
