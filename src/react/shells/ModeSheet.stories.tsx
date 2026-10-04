import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "../primitives/Alert";
import { Button } from "../primitives/Button";
import { Card, CardBody, CardTitle } from "../primitives/Card";
import { Chip } from "../primitives/Chip";
import { Field } from "../primitives/Field";
import { Meter } from "../primitives/Meter";
import { Masthead, PageHero, SiteFooter } from "../patterns/chrome";

/**
 * The same six components in fixed slots, so one picture of the Figma file in
 * a mode (a pack, or a density) can be laid over one picture of this page
 * under the same Pack and Density in the toolbar. Switch Pack and Density; the
 * Figma sheet for that mode is what the Onion shows.
 */
const meta = {
  title: "03 Foundations/08 Modes",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Six components in fixed slots, drawn live and drawn in Figma with the file's variable modes switched (ten packs, three densities). A pack or a density is only a claim until the design and the code agree under it. Use for: checking that the Figma modes and the Pack and Density toolbar say the same thing. Don't use for: judging a component; each component's own Onion skin does that.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const slot = (x: number, y: number, inlineSize?: number) =>
  ({ position: "absolute", insetInlineStart: x, insetBlockStart: y, inlineSize }) as const;

export const Sheet: Story = {
  name: "Mode sheet (Figma)",
  parameters: {
    onion: { component: "Modes", target: "root", skin: () => "wireframe.png" },
  },
  render: () => (
    <div style={{ position: "relative", inlineSize: 840, blockSize: 420, background: "var(--tk-surface-default)" }}>
      <div style={slot(24, 24)}>
        <Button>Button</Button>
      </div>
      <div style={slot(24, 96)}>
        <Chip>Chip</Chip>
      </div>
      <div style={slot(24, 160, 320)}>
        <Card>
          <CardTitle>Card title</CardTitle>
          <CardBody>Card body copy sits here and wraps inside the card, whatever its container is.</CardBody>
        </Card>
      </div>
      <div style={slot(400, 24, 400)}>
        <Alert title="Alert title">What happened, and what to do about it.</Alert>
      </div>
      <div style={slot(400, 160, 320)}>
        <Field label="Label" placeholder="Placeholder" />
      </div>
      <div style={slot(400, 300, 240)}>
        <Meter label="Label" value={50} display="50%" />
      </div>
    </div>
  ),
};

/* The same idea at pattern scale: a masthead, a page hero and a footer in fixed
   slots, 1024 wide. Heights move with a pack's density, so the slots leave room
   (a masthead to 100, a hero to 400, a footer to 340). */
export const PatternSheet: Story = {
  name: "Pattern sheet (Figma)",
  parameters: { onion: { component: "Modes", target: "root", skin: () => "patterns-wireframe.png" } },
  render: () => (
    <div style={{ position: "relative", inlineSize: 1024, blockSize: 860, background: "var(--tk-surface-default)" }}>
      <div style={slot(0, 0, 1024)}>
        <Masthead />
      </div>
      <div style={slot(0, 120, 1024)}>
        <PageHero />
      </div>
      <div style={slot(0, 520, 1024)}>
        <SiteFooter />
      </div>
    </div>
  ),
};
