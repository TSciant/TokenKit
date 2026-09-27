import type { Meta, StoryObj } from "@storybook/react-vite";

const CHAPTERS = [
  { num: "00", name: "Start", body: "Orientation and the system map." },
  { num: "01", name: "Ethos", body: "Browser truth — computed styles are the measurement." },
  { num: "02", name: "Tokens", body: "Ramp through export — the scales every component reads." },
  { num: "03", name: "Foundations", body: "Layers, context, composition and the shells, scrim, concentric corners, usable props, token optionality." },
  { num: "04", name: "Primitives", body: "The components, numbered by role — props, a11y, soft Use for / Don't use for on Docs." },
  { num: "05", name: "Patterns", body: "Composed patterns — headers, heroes, grids, directories, page templates." },
  { num: "06", name: "Motion", body: "FX system and host inference." },
  { num: "07", name: "Playground", body: "Drive the tokens and watch every slot resolve." },
  { num: "08", name: "Prototype", body: "Optional clickable proof — not the deliverable." },
  { num: "09", name: "Client", body: "Where a fork's own primitives and patterns go." },
];

const meta = {
  title: "00 Start/02 System map",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "One-screen map of Storybook chapters. Cite as chapter.section — e.g. 04.10 FAQ. Soft guidance lives on Docs tabs; Prototype is optional proof.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SystemMap: Story = {
  name: "System map",
  render: () => (
    <main
      data-shell="stack"
      data-gap="5"
      style={{ padding: "var(--tk-space-6)", maxInlineSize: "52rem" }}
    >
      <header data-shell="stack" data-gap="2">
        <p className="tk-doc-sub" style={{ margin: 0 }}>
          tokenkit · IA
        </p>
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          System map
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Cite stories as chapter.section — e.g. 02.02 Contract, 04.09 Modal, 08
          Prototype. Chapters are the kit as shipped; a fork adds its
          client&rsquo;s own sections rather than editing these.
        </p>
      </header>
      <div
        data-shell="grid"
        data-cols="2"
        data-gap="4"
        style={{ ["--_min" as string]: "14rem" }}
      >
        {CHAPTERS.map((c) => (
          <div
            key={c.num}
            data-tk="card"
            data-shell="stack"
            data-gap="2"
            style={{ padding: "var(--tk-space-4)" }}
          >
            <span
              style={{
                fontFamily: "var(--tk-font-mono)",
                fontSize: "var(--tk-size-sm)",
                color: "var(--tk-text-tertiary)",
              }}
            >
              {c.num}
            </span>
            <strong>{c.name}</strong>
            <p data-tk="card-body" style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </main>
  ),
};
