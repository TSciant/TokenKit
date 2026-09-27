import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page, Sub, useTokenReader, type ContextGlobals } from "./doc";
import { ToekneeWordmark } from "./ToekneeWordmark";

/**
 * Wordmark — toe knee → token → token kit.
 *
 * T and K pivot; other glyphs rearrange around them. Click to replay.
 * Reduced motion hard-cuts to the final frame.
 */

const meta = {
  title: "02 Tokens/10 Wordmark",
  component: ToekneeWordmark,
  argTypes: {
    width: { control: { type: "range", min: 160, max: 960, step: 20 } },
    height: { control: { type: "range", min: 48, max: 320, step: 4 } },
    autoplay: {
      control: "boolean",
      description: "Play on mount. Click the mark to replay either way.",
    },
    className: { control: "text" },
    style: { control: "object" },
  },
  args: { width: 640, height: 168, autoplay: true },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Three-beat canvas mark: toe knee → token → token kit. T and K are pivots. Timing from --tk-motion-transform / --tk-ease-entrance / --tk-ease-standard.",
      },
    },
  },
} satisfies Meta<typeof ToekneeWordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Toeknee: Story = {
  name: "toe knee → token → token kit",
  render: (args, ctx) => {
    const g = ctx.globals as ContextGlobals;
    const { ref } = useTokenReader([g.pack, g.density, g.root]);

    return (
      <Page
        hostRef={ref}
        title="Wordmark"
        note={
          <>
            <b>toe knee</b> → <b>token</b> → <b>token kit</b>. The <b>t</b> and{" "}
            <b>k</b> are pivots — they lead; the rest settles around them. Pace
            from <code>--tk-motion-transform</code>,{" "}
            <code>--tk-ease-entrance</code>, and <code>--tk-ease-standard</code>
            . Change the pack and replay.
          </>
        }
        spec={
          <>
            <b>click</b> replays · <b>reduced motion</b> final frame only ·{" "}
            <b>ink</b> <code>--tk-text-primary</code> / tertiary · Manrope via{" "}
            <code>--tk-font-sans</code>
          </>
        }
      >
        <Sub>Play</Sub>
        <div
          className="tk-stage"
          style={{
            display: "grid",
            placeItems: "center",
            paddingBlock: "var(--tk-space-7)",
            background: "var(--tk-surface-sunken)",
            borderRadius: "var(--tk-radius-nested)",
            border: "1px solid var(--tk-line-subtle)",
          }}
        >
          <ToekneeWordmark {...args} />
        </div>

        <Sub>Compact</Sub>
        <div style={{ display: "grid", placeItems: "center" }}>
          <ToekneeWordmark width={360} height={100} />
        </div>
      </Page>
    );
  },
};
