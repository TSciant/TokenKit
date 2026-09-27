import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Page,
  RADIUS_STEPS,
  SPACE_STEPS,
  Sub,
  TYPE_STEPS,
  useTokenReader,
  type ContextGlobals,
} from "./doc";

function Scales({ pack, density, root }: ContextGlobals) {
  const { ref, read, readPx } = useTokenReader([pack, density, root]);

  return (
    <Page
      hostRef={ref}
      title="Scales"
      note={
        <>
          Brand-independent. A pack may override these but most should not — a
          brand usually changes appearance, not proportion. Everything is rem
          and nothing is a viewport unit: fluid type built on <code>vw</code>{" "}
          ignores the reader's browser font-size setting, which is the thing
          WCAG 1.4.4 actually tests. Set the root control to 200% and watch both
          columns move together.
        </>
      }
      spec={
        <>
          <b>root font-size</b> {root}px · <b>--tk-density</b>{" "}
          {read("--tk-density") || "1"} · components multiply their own padding
          by density at the point of use, so these values are the input and not
          the result
        </>
      }
    >
      <Sub>Space</Sub>
      {SPACE_STEPS.map((i) => {
        const name = `--tk-space-${i}`;
        return (
          <div className="tk-space-row" key={name}>
            <code>{name}</code>
            <span>
              <span className="tk-space-bar" style={{ inlineSize: readPx(name) }} />
            </span>
            <span style={{ textAlign: "end" }}>{read(name) || "0"}</span>
          </div>
        );
      })}

      <Sub>Type</Sub>
      {TYPE_STEPS.map((s) => {
        const name = `--tk-size-${s}`;
        return (
          <div className="tk-type-row" key={name}>
            <span className="tk-type-tag">{s}</span>
            <span className="tk-type-sample" style={{ fontSize: `var(${name})` }}>
              Grayscale is the thesis
            </span>
            <span
              className="tk-type-tag"
              style={{ flex: "0 0 auto", marginInlineStart: "auto" }}
            >
              {read(name)} · {readPx(name).toFixed(0)}px
            </span>
          </div>
        );
      })}

      <Sub>Radius</Sub>
      <p className="tk-doc-note" style={{ margin: "0 0 var(--tk-space-3)" }}>
        Steps below are seeds and capsules. Nested boxes use the concentric
        formula (outer minus gap) — open{" "}
        <strong>03 Foundations / 05 Concentric corners</strong> for the corner
        audit, not a smaller step name.
      </p>
      <div className="tk-radius-set">
        {RADIUS_STEPS.map((r) => (
          <figure key={r}>
            <span
              className="tk-radius-box"
              style={{ borderRadius: `var(--tk-radius-${r})` }}
            />
            <figcaption>
              {r} · {read(`--tk-radius-${r}`)}
            </figcaption>
          </figure>
        ))}
      </div>

      <Sub>Target size — WCAG 2.5.8 floor is 24px</Sub>
      <div className="tk-space-row">
        <code>--tk-target-min</code>
        <span>
          <span
            className="tk-space-bar"
            style={{ inlineSize: readPx("--tk-target-min") }}
          />
        </span>
        <span style={{ textAlign: "end" }}>{read("--tk-target-min")}</span>
      </div>
      <div className="tk-space-row">
        <code>--tk-target-comfortable</code>
        <span>
          <span
            className="tk-space-bar"
            style={{ inlineSize: readPx("--tk-target-comfortable") }}
          />
        </span>
        <span style={{ textAlign: "end" }}>{read("--tk-target-comfortable")}</span>
      </div>
    </Page>
  );
}

/* No `component` on this meta, and no `<typeof Scales>` on the Meta.

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
  title: "02 Tokens/03 Scales",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Space, type, and radius steps. Radius steps are seeds and capsules — nested rounded UI uses --tk-radius-nested (outer minus gap). See 03 Foundations/05 Concentric corners for the corner audit. Use for: reading proportion tokens. Don't use for: picking sm/md/lg for inset children (that guesses the centre).",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SpaceTypeRadius: Story = {
  name: "Space, type, radius",
  render: (_args, ctx) => <Scales {...(ctx.globals as unknown as ContextGlobals)} />,
};
