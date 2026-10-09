import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SECTIONS, SECTION_TYPES } from "../../scene/sections.mjs";
import { Scene } from "./Scene";
import { SceneLayers } from "./SceneLayers";

/* The wireframe library: whole sections of a page, written in a scene as one
   part ({ kind: "section", type, variant, heading, … }) and drawn from the
   kit's own parts. Types are the audit taxonomy's, so an audited region and
   a section here mean the same thing. */

type Spec = { name: string; about: string; variants: Record<string, { about: string }> };
const LIB = SECTIONS as Record<string, Spec>;

const meta: Meta = {
  title: "05 Patterns/30 Wireframe library",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Whole sections of a page as scene parts: a type (the audit taxonomy's: hero, call-to-action, card-collection…), a layout variant, and the words it should carry. Each expands into the kit's own shells, headings, media, cards and buttons before the scene is sanitized, so a section draws nothing the kit wouldn't, and a page of them is data a reviewer can read, diff and edit. In the wireframe pack it is the grey page; in a brand pack, the same page dressed.",
      },
    },
  },
};
export default meta;

const one = (type: string, variant: string, extra: Record<string, unknown> = {}) => ({
  title: `${LIB[type].name}, ${variant}`,
  brand: "wireframe",
  root: { kind: "section", type, variant, ...extra },
});

export const EverySection: StoryObj = {
  name: "Every section",
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ padding: "var(--tk-space-6) var(--tk-gutter)" }}>
      {SECTION_TYPES.map((type) => (
        <section key={type} data-shell="stack" data-gap="4" aria-labelledby={`lib-${type}`}>
          <div data-shell="stack" data-gap="1">
            <h2 id={`lib-${type}`} style={{ margin: 0 }}>
              {LIB[type].name} <code style={{ fontSize: "var(--tk-size-sm)" }}>{type}</code>
            </h2>
            <p style={{ margin: 0, color: "var(--tk-text-secondary)" }}>{LIB[type].about}</p>
          </div>
          {Object.entries(LIB[type].variants).map(([variant, v]) => (
            <figure key={variant} style={{ margin: 0 }} data-shell="stack" data-gap="2">
              <figcaption>
                <strong>{variant}</strong> <span style={{ color: "var(--tk-text-secondary)" }}>· {v.about}</span>
              </figcaption>
              <div style={{ border: "1px solid var(--tk-line-subtle)", overflow: "hidden" }}>
                <Scene scene={one(type, variant)} />
              </div>
            </figure>
          ))}
        </section>
      ))}
    </div>
  ),
};

const PAGE = {
  title: "A page from sections",
  brand: "wireframe",
  root: {
    kind: "stack",
    gap: 0,
    children: [
      { kind: "section", type: "site-header", variant: "inline" },
      { kind: "section", type: "hero", variant: "split", eyebrow: "Services", heading: "Find the right service in a few steps", actions: ["Get started", "See how it works"] },
      { kind: "section", type: "feature-list", variant: "grid", heading: "What we help with", items: 6 },
      { kind: "section", type: "card-collection", variant: "grid-3", heading: "Latest updates" },
      { kind: "section", type: "media-with-text", variant: "picture-right", heading: "Meet the team behind the work" },
      { kind: "section", type: "newsletter-signup", variant: "field", heading: "Keep up to date", body: "A short email every week with what is new." },
      { kind: "section", type: "call-to-action", variant: "split", heading: "Ready to talk?", body: "Tell us what you are working on.", actions: ["Contact us"] },
      { kind: "section", type: "site-footer", variant: "columns" },
    ],
  },
};

export const APage: StoryObj = {
  name: "A page from sections",
  parameters: {
    docs: {
      description: {
        story: "Eight short section parts make a whole page; the layers beside it show what each expanded into. Point at a layer to find its part on the page.",
      },
    },
  },
  render: () => {
    const [active, setActive] = useState<string | null>(null);
    return (
      <div data-shell="sidebar" data-gap="4" data-side="end" style={{ padding: "var(--tk-space-4)" }}>
        <div style={{ border: "1px solid var(--tk-line-subtle)", overflow: "hidden" }}>
          <Scene scene={PAGE} active={active} onActive={setActive} />
        </div>
        <SceneLayers scene={PAGE} active={active} onActive={setActive} />
      </div>
    );
  },
};

type PlayArgs = { type: string; variant: string; heading: string; body: string; actions: string; items: number };

export const Playground: StoryObj<PlayArgs> = {
  args: { type: "hero", variant: "inline", heading: "A heading for this secsafdtion", body: "A sentence or two of what it is for.", actions: "Get started, Learn more", items: 3 },
  argTypes: {
    type: { control: "select", options: SECTION_TYPES },
    variant: { control: "select", options: [...new Set(Object.values(LIB).flatMap((s) => Object.keys(s.variants)))], description: "A layout the type has; another falls back to its first, with a note." },
    heading: { control: "text" },
    body: { control: "text" },
    actions: { control: "text", description: "Button labels, separated by commas." },
    items: { control: { type: "number", min: 1, max: 8 } },
  },
  render: ({ type, variant, heading, body, actions, items }) => (
    <Scene
      scene={one(type, variant, {
        heading,
        body,
        items,
        actions: actions
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      })}
    />
  ),
};
