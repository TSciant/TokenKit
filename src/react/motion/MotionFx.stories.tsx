import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { MotionFx } from "./MotionFx";
import { Card, CardBody, CardTitle } from "../primitives/Card";
import { Plate } from "../primitives/Plate";
import type { FxReveal } from "./types";

const meta = {
  title: "06 Motion/FX",
  component: MotionFx,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "IntersectionObserver reveals + CSS parallax, paced by --tk-motion-* tokens. Use Controls on Playground. prefers-reduced-motion disables both.",
      },
    },
    controls: { expanded: true },
  },
} satisfies Meta<typeof MotionFx>;

export default meta;
type Story = StoryObj;

type PlayArgs = {
  reveal: FxReveal;
  parallax: number;
  once: boolean;
  replay: number;
};

export const Playground: Story = {
  argTypes: {
    reveal: {
      control: "select",
      options: ["rise", "fade", "zoom", "blur-rise"],
    },
    parallax: { control: { type: "range", min: 0, max: 0.35, step: 0.01 } },
    once: { control: "boolean" },
    replay: {
      control: { type: "number", min: 0, step: 1 },
      description: "Increment to remount and replay",
    },
  },
  args: {
    reveal: "blur-rise",
    parallax: 0.16,
    once: false,
    replay: 0,
  },
  render: (raw) => {
    const args = raw as PlayArgs;
    return <PlayCanvas key={args.replay} {...args} />;
  },
};

function PlayCanvas({ reveal, parallax, once }: PlayArgs) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Start off-canvas then flip so the reveal always fires on mount.
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 120);
    return () => window.clearTimeout(t);
  }, [reveal, parallax, once]);

  return (
    <div
      data-shell="stack"
      data-gap="4"
      style={{ maxInlineSize: "28rem", padding: "var(--tk-space-5)" }}
    >
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Controls drive <code>fx</code>. Canvas remounts when you change reveal
        or bump <code>replay</code>.
      </p>
      {ready ? (
        <MotionFx fx={{ reveal, parallax, once }}>
          <Card interactive>
            <Plate stock seed={4} ratio="16 / 9" placement={false} />
            <CardTitle>
              {reveal} / parallax {parallax}
            </CardTitle>
            <CardBody>
              Scroll this panel a little to feel parallax. Set once=false to
              re-trigger on leave/enter.
            </CardBody>
          </Card>
        </MotionFx>
      ) : (
        <div style={{ blockSize: "12rem" }} aria-hidden="true" />
      )}
    </div>
  );
}

function Stack({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-shell="stack"
      data-gap="6"
      style={{
        padding: "var(--tk-space-6)",
        maxInlineSize: "40rem",
        marginInline: "auto",
      }}
    >
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Scroll - cards rise in; stock plates parallax against the scroll.
      </p>
      <div style={{ blockSize: "30vh" }} aria-hidden="true" />
      {children}
      <div style={{ blockSize: "40vh" }} aria-hidden="true" />
    </div>
  );
}

export const RevealAndParallax: Story = {
  name: "Scroll gallery",
  parameters: { layout: "fullscreen", controls: { disable: true } },
  render: () => (
    <Stack>
      {(["rise", "fade", "zoom", "blur-rise"] as const).map((reveal, i) => (
        <MotionFx key={reveal} fx={{ reveal, parallax: 0.1 + i * 0.03, once: false }}>
          <Card>
            <Plate stock seed={(i % 6) + 1} ratio="16 / 9" placement={false} />
            <CardTitle>FX - {reveal}</CardTitle>
            <CardBody>
              Reveal via IntersectionObserver; parallax writes --tk-fx-y.
            </CardBody>
          </Card>
        </MotionFx>
      ))}
    </Stack>
  ),
};

export const BooleanInfer: Story = {
  name: "fx={true} infers by host",
  parameters: { layout: "fullscreen", controls: { disable: true } },
  render: () => (
    <Stack>
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Same boolean - Plate hero vs card stock vs section pick different recipes.
      </p>
      <Plate stock seed={3} ratio="21 / 9" bleed fx={true} placement={false} />
      <Card fx={true} interactive>
        <Plate stock seed={2} ratio="16 / 9" fx={true} placement={false} />
        <CardTitle>Card + nested plate</CardTitle>
        <CardBody>
          Card infers rise@0.1; nested stock plate infers rise@0.14.
        </CardBody>
      </Card>
      <MotionFx fx={true}>
        <Card>
          <CardTitle>Section host</CardTitle>
          <CardBody>MotionFx defaults context=&quot;section&quot;.</CardBody>
        </Card>
      </MotionFx>
    </Stack>
  ),
};

export const CardFxProp: Story = {
  name: "Card fx prop",
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      {[1, 2, 3, 4].map((n) => (
        <Card key={n} fx={{ reveal: "rise", parallax: 0.14, once: false }} interactive>
          <Plate stock seed={n} ratio="16 / 9" placement={false} />
          <CardTitle>Card {n}</CardTitle>
          <CardBody>Same FX bound on the card root via useMotionFx.</CardBody>
        </Card>
      ))}
    </Stack>
  ),
};

/* ---------------------------------------------------------------------------
   The component's own props.

   Playground above drives a demo harness — its controls are the FX recipe,
   not MotionFx's signature. This one is the component itself, so the panel
   shows what a caller actually passes.
--------------------------------------------------------------------------- */
export const Props: StoryObj<typeof MotionFx> = {
  name: "MotionFx props",
  argTypes: {
    fx: {
      control: "object",
      description:
        "true infers a recipe from `context`; a reveal name or a full object overrides it.",
    },
    context: {
      control: "inline-radio",
      options: ["default", "section", "card", "plate", "plate-stock", "plate-hero"],
      description: "What to infer from when fx is true.",
    },
    as: { control: "text", description: "Element to render. Default div." },
    merge: {
      control: "boolean",
      description:
        "Merge the FX onto a single child instead of wrapping it, so the DOM keeps one node.",
    },
    className: { control: "text" },
    style: { control: "object" },
    children: { control: false, description: "Slot — composed elements, not text." },
  },
  args: { fx: true, context: "section", as: "div", merge: false },
  render: (args) => (
    <div data-shell="stack" data-gap="4" style={{ padding: "var(--tk-space-5)" }}>
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Scroll the card out of view and back to replay the reveal.
      </p>
      <div style={{ blockSize: "70vh" }} aria-hidden="true" />
      <MotionFx {...args}>
        <Card>
          <CardTitle>Revealed by MotionFx</CardTitle>
          <CardBody>
            Every value in the panel is a prop on the component, not on this
            story.
          </CardBody>
          <Plate ratio="16 / 9" seed={2} />
        </Card>
      </MotionFx>
      <div style={{ blockSize: "40vh" }} aria-hidden="true" />
    </div>
  ),
};
