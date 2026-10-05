import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field, type FieldProps } from "./Field";

const meta = {
  title: "04 Primitives/03 Field",
  component: Field,
  parameters: {
    docs: {
      description: {
        component:
          "Where the attribute model stops and markup semantics take over. The label association and the aria-describedby wiring are structural. Progressive layers: hint, error, required, and native select/textarea — all work without JS. Use for: Labeled text inputs and simple form controls with required or error slots. Don't use for: Search-as-you-type hit lists (Search results), or multi-step wizards that need their own layout.",
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: "Slot — composed elements, not text.",
    },
    control: { control: "inline-radio", options: ["input", "textarea", "select"] },
    required: { control: "boolean" },
    optional: { control: "boolean", description: "Marks the label (optional). Mark the minority of a form's fields." },
    readOnly: { control: "boolean", description: "Readable, focusable, submitted, not editable. Prefer it to disabled when the value matters." },
    prefix: { control: "text", description: "A short unit before the input; aria-hidden, so say it in the label too." },
    suffix: { control: "text", description: "A short unit after the input; aria-hidden, so say it in the label too." },
    chars: { control: "select", options: [undefined, 2, 3, 4, 5, 10, 20, 30], description: "Expected answer length in characters; sizes the control. Unset fills the container." },
    hint: { control: "text" },
    error: { control: "text" },
  },
  /* No placeholder anywhere in these stories, on purpose: a placeholder
     vanishes as soon as someone types, is not read by every screen reader and
     usually fails contrast. Where the format needs explaining, that is a hint. */
  args: { label: "Organisation" },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ProgressiveEnhancement: Story = {
  name: "Progressive enhancement",
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "28rem" }}>
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Native controls all the way down. Each step adds announced structure —
        never colour alone for meaning.
      </p>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">1 · Labelled input</p>
        <Field label="Email" type="email" autoComplete="email" />
      </div>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">2 · + hint</p>
        <Field
          label="Engagement code"
          hint="Six characters from the kickoff packet."
        />
      </div>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">3 · + required</p>
        <Field label="Company" required />
      </div>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">4 · + error (invalid)</p>
        <Field label="Engagement code" defaultValue="AQ-" error="Needs six characters." />
      </div>
      <div data-shell="stack" data-gap="3">
        <p className="tk-doc-sub">5 · Native select / textarea</p>
        <Field
          label="Industry"
          control="select"
          required
          options={[
            { value: "", label: "Choose an industry", disabled: true },
            { value: "software", label: "Software product" },
            { value: "consumer", label: "Retail or consumer brand" },
            { value: "gov", label: "Government agency" },
          ]}
        />
        <Field
          label="Details"
          control="textarea"
          required
          hint="Enough for us to route you to the right person."
          rows={4}
        />
      </div>
    </div>
  ),
};

export const WithHint: Story = {
  args: { hint: "Legal entity name as it appears on the agreement." },
};

export const WithError: Story = {
  args: {
    label: "Engagement code",
    defaultValue: "AQ-",
    error: "Needs six characters.",
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Locked" },
};

export const States: Story = {
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "26rem" }}>
      <Field label="Default" />
      <Field label="With hint" hint="Hint sits under the control." />
      <Field label="With error" defaultValue="bad" error="This field is required." />
      <Field label="Optional" optional />
      <Field label="Read-only" readOnly defaultValue="Can be read, not changed" hint="Set by your organisation." />
      <Field label="Disabled" disabled defaultValue="Locked" />
    </div>
  ),
};

/**
 * The box is as big as the answer.
 */
export const Widths: Story = {
  name: "Width by expected answer",
  parameters: {
    docs: {
      description: {
        story:
          "`chars` sizes the control to the answer it expects: the box's size is a hint about the answer's size, so a year field that spans the page reads as asking for more than a year. Measured in the control's own font (ch), so it follows the pack. Leave it unset for answers of no fixed length (a name, an email address), which fill the container. Never wider than the container, so a phone stays usable.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "32rem" }}>
      <Field label="Year of birth" chars={4} inputMode="numeric" autoComplete="bday-year" />
      <Field label="Card security code" hint="The last 3 digits on the back of the card." chars={3} inputMode="numeric" autoComplete="cc-csc" />
      <Field label="Postcode" chars={10} autoComplete="postal-code" />
      <Field label="Phone number" chars={20} type="tel" autoComplete="tel" />
      <Field label="Email address" type="email" autoComplete="email" />
    </div>
  ),
};

/**
 * Units, attached to the input but outside it.
 */
export const PrefixSuffix: Story = {
  name: "Prefix and suffix",
  parameters: {
    docs: {
      description: {
        story:
          "`prefix` and `suffix` put a short unit beside the input: attached, sharing one outline, but a separate box on the sunken ground. They are hidden from screen readers so the unit is not read as part of the value, which is why each label here says the unit in words too. Keep them to a symbol or a short unit; anything longer is a hint.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "32rem" }}>
      <Field label="Price, in dollars" prefix="$" chars={10} inputMode="decimal" />
      <Field label="Weight, in kilograms" suffix="kg" chars={5} inputMode="decimal" />
      <Field label="Discount, as a percentage" suffix="%" chars={3} inputMode="numeric" error="Enter a number from 0 to 100." />
      <Field label="Website" prefix="https://" type="url" autoComplete="url" />
    </div>
  ),
};

/* For Figma: a price with a prefix and a weight with a suffix, at 320. */
export const OnionSkinAffix: Story = {
  name: "Onion skin: prefix and suffix (Figma)",
  parameters: {
    docs: { description: { story: "A prefixed and a suffixed field at 320px, for the Figma FieldAffix component to be laid over." } },
    onion: { component: "FieldAffix", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ inlineSize: 320 }}>
      <Field label="Price, in dollars" prefix="$" chars={10} />
      <Field label="Weight, in kilograms" suffix="kg" chars={5} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { label: "Label" },
  argTypes: { disabled: { control: "boolean" }, invalid: { control: "boolean" } } as never,
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 320px width the design was drawn at. Switch Onion in the toolbar; control, invalid and disabled pick the skin." } },
    onion: {
      component: "Field",
      skin: (a: Record<string, unknown>) =>
        `${(a.control as string) ?? "input"}-${a.invalid ? "invalid" : a.disabled ? "disabled" : "default"}.png`,
    },
  },
  render: ({ invalid, ...args }: Record<string, unknown> & { invalid?: boolean }) => (
    <div style={{ inlineSize: 320 }}>
      <Field
        {...(args as unknown as FieldProps)}
        {...((args as { control?: string }).control === "select" ? { options: [{ value: "", label: "Choose one" }] } : {})}
        error={invalid ? "What went wrong." : undefined}
      />
    </div>
  ),
};
