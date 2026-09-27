import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { Card, CardBody, CardTitle } from "../react/primitives/Card";
import { Button } from "../react/primitives/Button";
import { Chip } from "../react/primitives/Chip";
import { Icon } from "../react/primitives/Icon";
import { Plate } from "../react/primitives/Plate";
import { MotionFx } from "../react/motion/MotionFx";
import { inferFx, type FxProp, type FxReveal } from "../react/motion/types";

/**
 * Usable props - polymorphic kit props hooked to Storybook Controls.
 */

type FxMode = "off" | "infer" | "string" | "object";
type FxHost = "card" | "section" | "plate-stock";

function buildFx(
  mode: FxMode,
  reveal: FxReveal,
  parallax: number,
  once: boolean,
): FxProp | undefined {
  if (mode === "off") return false;
  if (mode === "infer") return true;
  if (mode === "string") return reveal;
  return { reveal: reveal, parallax: parallax, once: once };
}

function fxLabel(
  mode: FxMode,
  reveal: FxReveal,
  parallax: number,
  once: boolean,
  host: FxHost,
): string {
  if (mode === "off") return "fx={false}";
  if (mode === "infer") {
    const ctx = host === "plate-stock" ? "plate-stock" : host === "section" ? "section" : "card";
    const inf = inferFx(ctx);
    return "fx={true} => " + String(inf.reveal) + " / parallax " + String(inf.parallax);
  }
  if (mode === "string") return 'fx="' + reveal + '"';
  return (
    "fx={{ reveal: '" +
    reveal +
    "', parallax: " +
    String(parallax) +
    ", once: " +
    String(once) +
    " }}"
  );
}

const meta = {
  title: "03 Foundations/06 Usable props",
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    docs: {
      description: {
        component:
          "Props hooked to Storybook Controls. Change mode / reveal / parallax and bump replay to see Motion FX on canvas. Use for: Learning Motion FX knobs (mode, reveal, parallax) on canvas with Controls, before you wire fx into a real host. Don't use for: Shipping pages from this playground alone; compose production UI from Shells + Components, and keep this as the teaching surface.",
      },
    },
  },
} satisfies Meta;

export default meta;

/* Every story on this page is its own playground with its own arg shape —
   that is what the page is for — so the args are the union of all of them,
   each optional.

   Two things this is NOT. It is not `StoryObj` bare: that types args as {},
   so every per-story arg read as a property of an empty object and the file
   was 21 errors deep. It is not `StoryObj<Record<string, unknown>>` either —
   an index-signature type structurally matches Storybook's "is this a meta?"
   test, so it is taken for a meta with no args and lands back on {}. A named
   interface is unambiguous, and it types the controls properly on the way
   through, which is the point of a page about props. */
interface PropArgs {
  // Fx
  mode?: "off" | "infer" | "string" | "object";
  reveal?: FxReveal;
  parallax?: number;
  once?: boolean;
  host?: FxHost;
  replay?: number;
  // Plate
  placement?: "quiet" | "loud" | false;
  seed?: number;
  bleed?: boolean;
  // Chip
  emphasis?: "default" | "strong" | "quiet";
  interactive?: boolean;
  pressed?: boolean;
  withLeading?: boolean;
  label?: string;
  // Button
  variant?: "solid" | "outline" | "quiet";
  size?: "sm" | "md" | "lg";
  busy?: boolean;
  disabled?: boolean;
  full?: boolean;
  withTrailing?: boolean;
  children?: string;
}

type Story = StoryObj<PropArgs>;

function FxDemo(props: {
  mode: FxMode;
  reveal: FxReveal;
  parallax: number;
  once: boolean;
  host: FxHost;
  replay: number;
}) {
  const fx = buildFx(props.mode, props.reveal, props.parallax, props.once);
  const label = fxLabel(props.mode, props.reveal, props.parallax, props.once, props.host);
  const [ready, setReady] = useState(false);

  useEffect(
    function () {
      setReady(false);
      const t = window.setTimeout(function () {
        setReady(true);
      }, 100);
      return function () {
        window.clearTimeout(t);
      };
    },
    [props.replay, props.mode, props.reveal, props.parallax, props.once, props.host],
  );

  const card = (
    <Card fx={props.host === "card" ? fx : undefined} interactive>
      <Plate
        stock
        seed={2}
        ratio="16 / 9"
        placement={false}
        fx={props.host === "plate-stock" ? fx : undefined}
      />
      <CardTitle>Motion FX on canvas</CardTitle>
      <CardBody>
        Open Controls. Change mode, then bump replay to remount the reveal.
      </CardBody>
    </Card>
  );

  return (
    <div
      data-shell="stack"
      data-gap="4"
      style={{ maxInlineSize: "28rem", padding: "var(--tk-space-5)" }}
    >
      <p className="tk-doc-note" style={{ margin: 0 }}>
        <code>{label}</code>
      </p>
      {ready ? (
        props.host === "section" ? (
          <MotionFx fx={fx}>{card}</MotionFx>
        ) : (
          card
        )
      ) : (
        <div style={{ blockSize: "10rem" }} aria-hidden="true" />
      )}
    </div>
  );
}

export const Fx: Story = {
  name: "fx",
  argTypes: {
    mode: {
      control: "inline-radio",
      options: ["off", "infer", "string", "object"],
    },
    reveal: {
      control: "select",
      options: ["rise", "fade", "zoom", "blur-rise"],
    },
    parallax: { control: { type: "range", min: 0, max: 0.35, step: 0.01 } },
    once: { control: "boolean" },
    host: {
      control: "inline-radio",
      options: ["card", "section", "plate-stock"],
    },
    replay: { control: { type: "number", min: 0, step: 1 } },
  },
  args: {
    mode: "object",
    reveal: "blur-rise",
    parallax: 0.16,
    once: false,
    host: "card",
    replay: 0,
  },
  render: function (args) {
    return (
      <FxDemo
        mode={args.mode as FxMode}
        reveal={args.reveal as FxReveal}
        parallax={args.parallax as number}
        once={args.once as boolean}
        host={args.host as FxHost}
        replay={args.replay as number}
      />
    );
  },
};

export const Placement: Story = {
  name: "placement",
  argTypes: {
    placement: { control: "inline-radio", options: ["quiet", "loud", false] },
    seed: { control: { type: "number", min: 1, max: 6, step: 1 } },
    bleed: { control: "boolean" },
  },
  args: { placement: "quiet", seed: 1, bleed: false },
  render: function (args) {
    const placement = args.placement as "quiet" | "loud" | false;
    return (
      <div
        data-shell="stack"
        data-gap="3"
        style={{ maxInlineSize: "22rem", padding: "var(--tk-space-5)" }}
      >
        <p className="tk-doc-note" style={{ margin: 0 }}>
          <code>
            placement=
            {placement === false ? "{false}" : '"' + String(placement) + '"'}
          </code>
        </p>
        <Plate
          stock
          seed={args.seed as number}
          ratio="4 / 3"
          bleed={(args.bleed as boolean) || undefined}
          placement={placement}
        />
      </div>
    );
  },
};

export const ChipProps: Story = {
  name: "Chip",
  argTypes: {
    emphasis: {
      control: "inline-radio",
      options: ["default", "strong", "quiet"],
    },
    interactive: { control: "boolean" },
    pressed: { control: "boolean" },
    withLeading: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    emphasis: "default",
    interactive: true,
    pressed: false,
    withLeading: true,
    label: "Client",
  },
  render: function (args) {
    const emphasis = args.emphasis as string;
    return (
      <div style={{ padding: "var(--tk-space-5)" }} data-shell="stack" data-gap="3">
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Chip hugs its label - never stretches full row width.
        </p>
        <Chip
          emphasis={emphasis === "default" ? undefined : (emphasis as "strong" | "quiet")}
          interactive={(args.interactive as boolean) || undefined}
          pressed={(args.pressed as boolean) || undefined}
          leading={
            (args.withLeading as boolean) ? (
              <Icon name="building" size="sm" />
            ) : undefined
          }
        >
          {String(args.label)}
        </Chip>
      </div>
    );
  },
};

export const ButtonProps: Story = {
  name: "Button",
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["solid", "outline", "quiet"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    busy: { control: "boolean" },
    disabled: { control: "boolean" },
    full: { control: "boolean" },
    withTrailing: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    variant: "solid",
    size: "md",
    busy: false,
    disabled: false,
    full: false,
    withTrailing: true,
    children: "Why tokens first",
  },
  render: function (args) {
    return (
      <div style={{ padding: "var(--tk-space-5)", maxInlineSize: "24rem" }}>
        <Button
          variant={args.variant as "solid" | "outline" | "quiet"}
          size={args.size as "sm" | "md" | "lg"}
          busy={(args.busy as boolean) || undefined}
          disabled={(args.disabled as boolean) || undefined}
          full={(args.full as boolean) || undefined}
          trailing={
            (args.withTrailing as boolean) ? (
              <Icon name="arrowRight" size="sm" />
            ) : undefined
          }
        >
          {String(args.children)}
        </Button>
      </div>
    );
  },
};
