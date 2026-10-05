import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardTitle, CardBody, CardFooter, CardHeader } from "./Card";
import { MenuButton } from "./MenuButton";
import { Guidance, GuidancePair } from "./Guidance";
import { Plate } from "./Plate";
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

/**
 * A clickable card, the accessible way.
 *
 * The title carries the link (`CardTitle href`), stretched over the card, so
 * the whole card is the target but the link is named by the title alone. A
 * button inside still works: it sits above the stretch. Hover darkens the
 * edge and moves nothing; keyboard focus rings the whole card.
 */
export const Clickable: Story = {
  name: "Clickable (stretched link)",
  parameters: {
    docs: {
      description: {
        story:
          "Give `CardTitle` an `href` and the card is clickable: the title is the link, stretched over the card. A screen reader hears the title as the link's name rather than every word on the card, and controls inside the card (the Save button here) still work, because they sit above the stretch. Hover darkens the border and nothing moves; Tab rings the whole card. Don't wrap a card in a link as well.",
      },
    },
  },
  render: () => (
    <div data-shell="grid" data-cols="2" data-gap="5" style={{ maxInlineSize: "44rem" }}>
      {["Density is a multiplier", "Asking the box, not the window"].map((t) => (
        <Card key={t} interactive>
          <CardTitle href="#main">{t}</CardTitle>
          <CardBody>A card is a way into something longer. The title says what; the link is the title.</CardBody>
          <CardFooter>
            <Button variant="quiet" size="sm" onClick={() => undefined}>
              Save for later
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
};

/**
 * Cards in a grid match heights, whether they are the grid's cells or sit
 * one element in (ul > li > card), so footers share a line.
 */
export const EqualHeights: Story = {
  name: "Equal heights in a grid",
  parameters: {
    docs: {
      description: {
        story:
          "Three cards with different amounts to say, in a list laid out on the grid shell. Every card fills its cell and every footer sits on the same line. Nothing in the markup asks for it: a card that is a grid cell, or the only child of one, fills it.",
      },
    },
  },
  render: () => (
    <ul data-shell="grid" data-cols="3" data-gap="5" style={{ listStyle: "none", margin: 0, padding: 0, maxInlineSize: "60rem" }}>
      {[
        "A short one.",
        "A card with a little more to say, so its body runs to a second or third line before the footer.",
        "The longest of the three: enough text that, without equal heights, its footer would sit well below the other two and the row would read as three separate things rather than a set.",
      ].map((body, i) => (
        <li key={i}>
          <Card>
            <CardTitle>Card {i + 1}</CardTitle>
            <CardBody>{body}</CardBody>
            <CardFooter>
              <Button variant="quiet" size="sm">Open</Button>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  ),
};

/**
 * The header: an eyebrow above the title, a subtitle under it, an action at
 * the end. The action works on a clickable card and its menu opens past the
 * card's edge.
 */
export const WithHeader: Story = {
  name: "With a header",
  parameters: {
    docs: {
      description: {
        story:
          "`CardHeader` holds an eyebrow (a kind, a status, a date), the title, a one-line subtitle and one small action at the end. Here the cards are also clickable (stretched title link) and the action is a MenuButton: it sits above the stretch, so it opens its own menu rather than following the link, and the menu opens past the card's edge. Use a header only when there is something to put in it; a title alone is just CardTitle.",
      },
    },
  },
  render: () => (
    <div data-shell="grid" data-cols="2" data-gap="5" style={{ maxInlineSize: "44rem", paddingBlockEnd: "10rem" }}>
      {[["Case study", "Density is a multiplier", "Published 3 October"], ["In progress", "Asking the box, not the window", "Updated yesterday"]].map(([eyebrow, title, subtitle]) => (
        <Card key={title} interactive>
          <CardHeader
            eyebrow={eyebrow}
            subtitle={subtitle}
            action={<MenuButton label="More" variant="quiet" align="end" items={[{ label: "Share" }, { label: "Duplicate" }, { label: "Archive" }]} />}
          >
            <CardTitle href="#main">{title}</CardTitle>
          </CardHeader>
          <CardBody>A card is a way into something longer. The title says what; the link is the title.</CardBody>
        </Card>
      ))}
    </div>
  ),
};

/* The header drawn for Figma: eyebrow, title, subtitle and a closed More, at 320. */
export const OnionSkinHeader: Story = {
  name: "Onion skin: header (Figma)",
  parameters: {
    docs: { description: { story: "A card with a header at 320px, for the Figma CardHeader to be laid over." } },
    onion: { component: "CardHeader", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div style={{ inlineSize: 320 }}>
      <Card>
        <CardHeader
          eyebrow="Case study"
          subtitle="Published 3 October"
          action={<MenuButton label="More" align="end" items={[{ label: "Share" }]} />}
        >
          <CardTitle>Density is a multiplier</CardTitle>
        </CardHeader>
        <CardBody>A card is a way into something longer.</CardBody>
      </Card>
    </div>
  ),
};

const Rule = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section data-shell="stack" data-gap="3">
    <h2 style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>{title}</h2>
    {children}
  </section>
);

/**
 * How to use a card: one subject, one way in, a set that looks alike.
 *
 * From the ds-corpus card brief (USWDS, Lightning, PatternFly), in our words,
 * with live cards so the guidance stays true when the card changes.
 */
export const UsingCards: Story = {
  name: "Using cards",
  parameters: {
    docs: {
      description: {
        story:
          "The rules for putting cards on a page, each with its reason, as Do and Don't pairs of live cards. Drawn from the ds-corpus card brief: USWDS's modular set, Lightning's one task per card and its warning about whole-card clicks, PatternFly's rule that a clickable card holds nothing else clickable.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ maxInlineSize: "56rem" }}>
      <Rule title="One subject, and a way into it">
        <GuidancePair>
          <Guidance tone="do" note="A card summarises one thing and leads to it: a title, a sentence or two, and the way in. The destination is a page; the card is the door.">
            <Card interactive>
              <CardTitle href="#main">Density is a multiplier</CardTitle>
              <CardBody>One number scales every space in a region, so compact and comfortable are the same layout.</CardBody>
            </Card>
          </Guidance>
          <Guidance tone="dont" note="Don't put the whole article in the card. A card that needs paragraphs or its own headings is a page squeezed into a box, and a grid of them is a wall to read.">
            <Card>
              <CardTitle>Density is a multiplier</CardTitle>
              <CardBody>One number scales every space in a region. It is read by the space ramp, so shells, components and inline styles all follow it.</CardBody>
              <CardBody>That means compact and comfortable are not two layouts but one, and a nested region can change density without anything inside it knowing.</CardBody>
            </Card>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="The title is the link">
        <GuidancePair>
          <Guidance tone="do" note="Make the title the link (CardTitle href). It is stretched over the card, so the whole card is the target, and the link is named by the title: a screen-reader user scanning a list of links hears where each one goes.">
            <Card interactive>
              <CardTitle href="#main">Asking the box, not the window</CardTitle>
              <CardBody>Container queries size a component by the space it is given.</CardBody>
            </Card>
          </Guidance>
          <Guidance tone="dont" note="Don't add a Read more link. Every card then has a link with the same name, so the list of links is Read more, Read more, Read more, and the title, which says where it goes, is not a link at all.">
            <Card>
              <CardTitle>Asking the box, not the window</CardTitle>
              <CardBody>Container queries size a component by the space it is given.</CardBody>
              <CardFooter>
                <a href="#main">Read more</a>
              </CardFooter>
            </Card>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="One way in">
        <GuidancePair>
          <Guidance tone="do" note="If the card is a link, anything else in it is a small, separate action (Save, a More menu), and it sits above the stretched link so it still works. If the card has several real actions, it is not a link: put the actions in the footer as buttons.">
            <Card interactive>
              <CardTitle href="#main">Precedence before specificity</CardTitle>
              <CardBody>Cascade layers settle the order before selectors are compared.</CardBody>
              <CardFooter>
                <Button variant="quiet" size="sm" onClick={() => undefined}>Save for later</Button>
              </CardFooter>
            </Card>
          </Guidance>
          <Guidance tone="dont" note="Don't wrap a card in a link and then put buttons inside it. A control inside a link is invalid, the browser has to guess which one was meant, and the link's name becomes every word on the card. (Not shown live, because the markup itself is the mistake.)">
            <Card>
              <CardTitle>Precedence before specificity</CardTitle>
              <CardBody>The whole card a link, with a Save button inside it: two targets on top of each other.</CardBody>
            </Card>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="A set looks alike">
        <GuidancePair>
          <Guidance tone="do" note="Cards in a row share a shape: the same parts in the same order, so the eye compares content, not layout. A set should survive being reordered (or filtered) without any card looking out of place.">
            <div data-shell="grid" data-cols="2" data-fixed data-gap="3">
              {["Layers", "Density"].map((t, i) => (
                <Card key={t} interactive>
                  <Plate stock ratio="16 / 9" seed={i + 1} placement={false} />
                  <CardTitle href="#main">{t}</CardTitle>
                </Card>
              ))}
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't mix shapes in one row: a picture on one card, a button on the next, three lines of text on a third. Every difference has to be read before the content can be, and the row stops reading as a set.">
            <div data-shell="grid" data-cols="2" data-fixed data-gap="3">
              <Card>
                <Plate stock ratio="16 / 9" seed={1} placement={false} />
                <CardTitle>Layers</CardTitle>
              </Card>
              <Card variant="flat">
                <CardTitle>Density</CardTitle>
                <CardBody>A different surface, no picture, and a button.</CardBody>
                <Button size="sm">Open</Button>
              </Card>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="A real heading, in sentence case">
        <GuidancePair>
          <Guidance tone="do" note="CardTitle is a heading (h3 by default; set as to fit the page), so cards appear in a screen reader's list of headings under the section they belong to. Write it in sentence case, as you would say it.">
            <Card>
              <CardTitle>Breakpoints describe a device nobody is holding</CardTitle>
            </Card>
          </Guidance>
          <Guidance tone="dont" note="Don't fake a title with bold text, and don't Title Case it. The bold text looks the same and is missing from the headings list; capitals on every word slow reading and add nothing.">
            <Card>
              <strong style={{ fontSize: "var(--tk-size-lg)" }}>Breakpoints Describe A Device Nobody Is Holding</strong>
            </Card>
          </Guidance>
        </GuidancePair>
      </Rule>
    </div>
  ),
};

export const OnionSkin: Story = {
  args: {
    interactive: true,
    fx: {}
  },

  name: "Onion skin (Figma)",

  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 320px width the design was drawn at. Switch Onion in the toolbar; variant and interactive pick the skin." } },
    onion: {
      component: "Card",
      skin: (a: Record<string, unknown>) => `${(a.variant as string) ?? "default"}-${a.interactive ? "true" : "false"}-default.png`,
    },
  },

  render: (args) => (
    <div style={{ inlineSize: 320 }}>
      <Card {...args}>
        <CardTitle>Card title</CardTitle>
        <CardBody>Card body copy sits here and wraps inside the card, whatever its container is.</CardBody>
      </Card>
    </div>
  )
};
