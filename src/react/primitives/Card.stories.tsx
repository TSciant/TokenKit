import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardTitle, CardBody, CardFooter } from "./Card";
import { Button } from "./Button";
import { Chip } from "./Chip";

const meta = {
  title: "04 Primitives/05 Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          "Declares itself a query container, so its contents size against the card rather than the viewport. The title steps up once the card passes 42rem wide — a width measured by the type gate rather than chosen, being where the larger size stops costing an extra line. Resizing the browser does nothing to it. Use for: Grouped content that should size to its own box; teaser blocks, feed items, feature tiles. Don't use for: Full page layouts (use shells + sections), or a single naked paragraph with no grouping need.",
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: "Slot — composed elements, not text.",
    },
    variant: { control: "inline-radio", options: ["default", "flat", "bare"] },
    interactive: { control: "boolean" },
  },
  render: (args) => (
    <Card {...args}>
      <CardTitle>Type follows the box</CardTitle>
      <CardBody>
        The card is a query container. Its contents respond to its own inline
        size.
      </CardBody>
      <div data-shell="inline" data-gap="2">
        <Chip>token</Chip>
        <Chip emphasis="strong">container</Chip>
      </div>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div data-shell="grid" data-cols="3" data-gap="4">
      <Card>
        <CardTitle>Default</CardTitle>
        <CardBody>Bordered, raised surface.</CardBody>
      </Card>
      <Card variant="flat">
        <CardTitle>Flat</CardTitle>
        <CardBody>Sunken, no boundary.</CardBody>
      </Card>
      <Card interactive>
        <CardTitle>Interactive</CardTitle>
        <CardBody>Boundary raised to line-strong for 1.4.11.</CardBody>
      </Card>
    </div>
  ),
};

export const ContainerResponse: Story = {
  name: "Container response",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <p className="tk-doc-note">
        The same card at three widths, straddling the measured 42rem step. No
        breakpoint guessing, no resize listener, and no knowledge of the
        viewport — each one is reading its own box.
      </p>
      {[24, 38, 48].map((rem) => (
        <div key={rem}>
          <p className="tk-doc-sub">{rem}rem</p>
          <div style={{ inlineSize: `${rem}rem`, maxInlineSize: "100%" }}>
            <Card>
              <CardTitle>Type follows the box</CardTitle>
              <CardBody>The title steps up at 42rem of card width.</CardBody>
              <CardFooter>
                <Button size="sm" variant="outline">
                  Action
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ))}
    </div>
  ),
};
