import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon, ICON_NAMES, type IconName } from "./Icon";
import { ICON_GROUPS } from "./icon-set";
import { Guidance, GuidancePair } from "./Guidance";

const meta = {
  title: "04 Primitives/04 Icon",
  component: Icon,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Lucide via react-icons: 221 glyphs in 15 groups, one family, weighted by --tk-icon-stroke. Use for: anything where a glyph reinforces a label. Don't use for: anything where the glyph IS the label and no text accompanies it — pass `label` in that case and the icon becomes an image with a name.",
      },
    },
  },
  argTypes: {
    name: { control: "select", options: ICON_NAMES },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    label: { control: "text" },
  },
  args: { name: "search", size: "md" },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * The whole set, grouped the way somebody actually searches it.
 *
 * With a filter, because 221 of anything is a wall. Typing narrows on the
 * kit's own name — which is the name a consumer writes — rather than on the
 * upstream glyph name, since the upstream name is deliberately not part of
 * the API.
 */
function Catalogue() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();

  const groups = useMemo(
    () =>
      Object.entries(ICON_GROUPS)
        .map(([group, names]) => [
          group,
          needle
            ? names.filter(
                (n) =>
                  n.toLowerCase().includes(needle) ||
                  group.toLowerCase().includes(needle),
              )
            : names,
        ] as const)
        .filter(([, names]) => names.length > 0),
    [needle],
  );

  const shown = groups.reduce((n, [, names]) => n + names.length, 0);

  return (
    <div data-shell="stack" data-gap="5" style={{ padding: "var(--tk-space-5)" }}>
      <div data-shell="stack" data-gap="2">
        <label data-shell="stack" data-gap="1" style={{ maxInlineSize: "22rem" }}>
          <span data-tk="eyebrow">Filter</span>
          <input
            data-tk="input"
            type="search"
            value={q}
            placeholder="delivery, calendar, chevron…"
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          {shown} of {ICON_NAMES.length} shown. Change the pack in the toolbar
          and every glyph re-weights: <code>--tk-icon-stroke</code> is 2.5
          under Door Shop and 1.5 under Mohave, and not one of these is a
          different file.
        </p>
      </div>

      {groups.map(([group, names]) => (
        <section key={group} data-shell="stack" data-gap="3">
          <h3 style={{ margin: 0, fontSize: "var(--tk-size-md)" }}>{group}</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))",
              gap: "var(--tk-space-2)",
            }}
          >
            {names.map((name) => (
              <div
                key={name}
                data-tk="card"
                data-variant="flat"
                style={{ alignItems: "center", textAlign: "center" }}
              >
                <Icon name={name as IconName} size="lg" />
                <code
                  style={{
                    fontSize: "var(--tk-size-xs)",
                    wordBreak: "break-word",
                  }}
                >
                  {name}
                </code>
              </div>
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 ? (
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Nothing matches “{q}”. The set is curated rather than exhaustive —
          adding a glyph is one line in tools/gen-icon-set.mjs.
        </p>
      ) : null}
    </div>
  );
}

export const AllIcons: Story = {
  name: "Catalogue",
  render: () => <Catalogue />,
};

/**
 * Weight is a token, and this is the story that proves it.
 *
 * The same six glyphs at four stroke widths. Nothing below changes component,
 * file or import — only `--tk-icon-stroke`, which the packs fill.
 */
export const Weight: Story = {
  name: "Stroke weight",
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ padding: "var(--tk-space-5)" }}>
      <p className="tk-doc-note" style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
        Lucide puts the weight in <code>stroke-width</code> as a presentation
        attribute on the root <code>&lt;svg&gt;</code>, and a presentation
        attribute loses to any author rule. So one line of CSS re-weights all
        221 glyphs and a brand owns icon weight the way it owns everything
        else. Phosphor ships six weights as six separate components, which a
        custom property cannot select — the larger set was the worse fit.
      </p>
      {[
        ["1.25", "Hairline — a quiet, type-led brand"],
        ["1.5", "Mohave"],
        ["2", "The kit's default, and Lucide's"],
        ["2.5", "Door Shop — matched to a 900 display face"],
      ].map(([stroke, why]) => (
        <div
          key={stroke}
          data-shell="inline"
          data-gap="4"
          style={{
            alignItems: "center",
            ["--tk-icon-stroke" as string]: stroke,
          }}
        >
          <code style={{ inlineSize: "3rem", fontSize: "var(--tk-size-sm)" }}>{stroke}</code>
          <div data-shell="inline" data-gap="3">
            {(["home", "truck", "calendar", "heart", "settings", "package"] as IconName[]).map(
              (n) => (
                <Icon key={n} name={n} size="lg" />
              ),
            )}
          </div>
          <span style={{ fontSize: "var(--tk-size-sm)", color: "var(--tk-text-tertiary)" }}>
            {why}
          </span>
        </div>
      ))}
    </div>
  ),
};

/**
 * When an icon needs a name and when it must not have one.
 */
export const Labelling: Story = {
  name: "Labelling",
  render: () => (
    <div style={{ padding: "var(--tk-space-5)" }}>
      <GuidancePair>
        <Guidance
          tone="do"
          note="Leave an icon decorative when text beside it already says the same thing. Pass no label and it is aria-hidden, so a screen reader reads the button once instead of twice."
        >
          <button type="button" data-tk="button" data-variant="solid" data-size="md">
            <Icon name="download" size="sm" />
            Download the report
          </button>
        </Guidance>
        <Guidance
          tone="dont"
          note="Don't ship an icon-only control with no label. Visually it is a glyph; to a screen reader it is a button with no name, and the guess it invites is rarely the right one."
        >
          <div data-shell="inline" data-gap="2">
            <button type="button" data-tk="button" data-variant="outline" data-size="md">
              <Icon name="trash" size="sm" label="Delete" />
            </button>
            <span style={{ fontSize: "var(--tk-size-sm)", color: "var(--tk-text-tertiary)" }}>
              this one passes <code>label</code>, which is the fix
            </span>
          </div>
        </Guidance>
      </GuidancePair>
    </div>
  ),
};
