import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Page, Sub, useTokenReader, type ContextGlobals } from "./doc";
import { SLOTS } from "./slots";

/**
 * Export — every contract slot, resolved, as JSON.
 *
 * The last section on purpose: the rest of Tokens explains one family at a
 * time, and this is all of them at once, in the form a consumer outside CSS
 * actually needs. A native team, a Figma sync and an email template can none of
 * them resolve a custom property, so what they get handed has to be values.
 *
 * Generated here rather than transcribed. It is the same read used by every
 * other token page — getComputedStyle on a real element in whatever context the
 * toolbar is set to — so the JSON on screen is the JSON the page is rendered
 * with. `npm run tokens` runs the same thing headlessly and writes
 * dist/tokens/<pack>.json for every pack and context at once.
 */

const meta = {
  title: "02 Tokens/09 Export",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Every contract slot resolved to a value and grouped by family, as JSON. Generated from computed styles in the context the toolbar is set to — the same reader the rest of Tokens uses, and the same output as `npm run tokens`.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const typeOf = (name: string, value: string) => {
  if (/^(rgb|rgba|#|color\()/.test(value)) return "color";
  if (/^--tk-(duration)/.test(name)) return "duration";
  if (/^--tk-(ease)/.test(name)) return "cubicBezier";
  if (/^--tk-motion/.test(name)) return "transition";
  if (/^--tk-weight/.test(name)) return "fontWeight";
  if (/^--tk-font/.test(name)) return "fontFamily";
  if (/^--tk-shadow/.test(name)) return "shadow";
  if (/^--tk-(leading|tracking|density|scrim)/.test(name)) return "number";
  if (/px$|rem$|em$|ch$|%$/.test(value)) return "dimension";
  return "other";
};

const familyOf = (name: string) => {
  const rest = name.replace("--tk-", "");
  const head = rest.split("-")[0];
  return { group: head, leaf: rest.slice(head.length + 1) || head };
};

export const Export: Story = {
  name: "Export",
  render: (_args, ctx) => {
    const g = ctx.globals as ContextGlobals;
    const { ref, read, nonce } = useTokenReader([g.pack, g.density, g.root]);
    const [copied, setCopied] = useState(false);

    const doc = useMemo(() => {
      const tokens: Record<string, Record<string, unknown>> = {};
      const resolved: Record<string, string> = {};
      let filled = 0;

      for (const slot of SLOTS) {
        const value = read(slot);
        if (!value) continue;
        filled++;
        resolved[slot] = value;
        const { group, leaf } = familyOf(slot);
        tokens[group] ??= {};
        tokens[group][leaf] = { $value: value, $type: typeOf(slot, value), source: slot };
      }

      return {
        $description:
          "tokenkit contract, resolved from computed styles. Every value is what the browser produced in this context, not what the source said.",
        context: { pack: g.pack, density: g.density, rootFontSize: `${g.root}px` },
        slotCount: SLOTS.length,
        filled,
        tokens,
        resolved,
      };
      // nonce is what re-runs this when the toolbar moves
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nonce, g.pack, g.density, g.root]);

    const json = JSON.stringify(doc, null, 2);
    const groups = Object.keys(doc.tokens).sort();

    return (
      <Page
        hostRef={ref}
        title="Export"
        note={
          <>
            Every contract slot, resolved, grouped by family. This is the whole
            contract in one object — the form a consumer outside CSS needs,
            because a native team, a Figma sync and an email template can none of
            them resolve a custom property.
          </>
        }
        spec={
          <>
            <b>{doc.filled} of {doc.slotCount} slots filled</b> · {groups.length}{" "}
            families · a slot that is blank here is one the current pack does not
            fill, which <code>npm run lint:css</code> also reports ·{" "}
            <code>npm run tokens</code> writes every pack and context to{" "}
            <code>dist/tokens/</code>
          </>
        }
      >
        <Sub>Families</Sub>
        <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
          {groups.map((name) => (
            <span key={name} data-tk="chip">
              {name} · {Object.keys(doc.tokens[name]).length}
            </span>
          ))}
        </div>

        <Sub>
          {g.pack} · {g.density} · {g.root}px
        </Sub>
        <p className="tk-doc-note">
          Change the pack, density or root size in the toolbar and this
          regenerates. The values are read, not stored, so the document below
          cannot be out of date with the page it is describing.
        </p>

        <div data-shell="inline" data-gap="3" style={{ marginBlockEnd: "var(--tk-space-3)" }}>
          <button
            type="button"
            data-tk="button"
            data-size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(json).then(
                () => setCopied(true),
                () => setCopied(false),
              );
            }}
          >
            Copy JSON
          </button>
          <span
            role="status"
            style={{
              fontFamily: "var(--tk-font-mono)",
              fontSize: "var(--tk-size-xs)",
              color: "var(--tk-text-secondary)",
              alignSelf: "center",
            }}
          >
            {copied ? "copied" : `${(json.length / 1024).toFixed(1)}KB`}
          </span>
        </div>

        {/* A scrollable region is focusable, or a keyboard user cannot reach
            the content inside it. tabIndex plus a label is what makes a
            scroll container legitimate rather than a trap. */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Resolved token document, JSON"
          className="tk-stage"
          style={{
            maxBlockSize: "36rem",
            overflow: "auto",
            padding: "var(--tk-space-4)",
          }}
        >
          <pre
            style={{
              margin: 0,
              fontFamily: "var(--tk-font-mono)",
              fontSize: "var(--tk-size-xs)",
              lineHeight: "var(--tk-leading-normal)",
              whiteSpace: "pre",
            }}
          >
            {json}
          </pre>
        </div>
      </Page>
    );
  },
};
