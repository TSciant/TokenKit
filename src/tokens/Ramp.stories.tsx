import type { Meta, StoryObj } from "@storybook/react-vite";
import { relativeLuminance, contrastRatio, format } from "../lib/contrast";
import {
  Page,
  RAMP_STEPS,
  TokenRow,
  useTokenReader,
  type ContextGlobals,
} from "./doc";

/**
 * The ramp. Fourteen true neutrals and the only literal colour values in the
 * whole kit — every other file is forbidden one, and `npm run lint:css` fails
 * the build if a component gains one.
 */
function Ramp({ pack, density, root }: ContextGlobals) {
  const { ref, read } = useTokenReader([pack, density, root]);
  const surface = read("--tk-surface-default");

  return (
    <Page
      hostRef={ref}
      title="Ramp"
      note={
        <>
          Fourteen true neutrals, R = G = B. Grayscale is the thesis here, not a
          placeholder and not caution: with no hue in play every pair is a pure
          luminance comparison, which is what makes the system checkable end to
          end. Switch the pack in the toolbar and this table does not change —
          the ramp is constant, only the mapping moves. Open <strong>Progressive theming</strong> (and <strong>Branded overrides</strong>) under this section for the paper slider and thin brand slots.
        </>
      }
      spec={
        <>
          <b>src/css/packs/wireframe.css</b> · 14 literals · ratio column is
          against <b>--tk-surface-default</b> = {surface || "—"}
        </>
      }
    >
      {RAMP_STEPS.map((step) => {
        const name = `--wf-${step}`;
        const value = read(name);
        const lum = relativeLuminance(value);
        const ratio = contrastRatio(value, surface);
        return (
          <TokenRow
            key={name}
            name={name}
            value={value}
            verdict={`L ${lum == null ? "—" : lum.toFixed(4)} · ${format(ratio)}`}
          />
        );
      })}
    </Page>
  );
}

/* No `component` on this meta, and no `<typeof Ramp>` on the Meta.

   Both of those make Storybook infer the story's args from the component's
   props — and this page has no args. It is driven entirely by the toolbar
   globals (pack, density, root); every render here reads ctx.globals and
   ignores what it was handed. Binding the two made the component's props
   required args, so each story was a type error for not supplying values that
   would have been overwritten on the next line. The prose in
   parameters.docs.description is what the docs page needed from `component`
   anyway; a props table of three globals would have been a lie about where
   they come from. */
const meta = {
  title: "02 Tokens/01 Colour/01 Ramp",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ramp14: Story = {
  name: "Fourteen greys",
  render: (_args, ctx) => <Ramp {...(ctx.globals as unknown as ContextGlobals)} />,
};
