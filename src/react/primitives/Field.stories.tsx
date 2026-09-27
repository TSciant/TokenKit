import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "./Field";

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
    hint: { control: "text" },
    error: { control: "text" },
  },
  args: { label: "Organisation", placeholder: "Acme Design Systems Group" },
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
      <Field label="Default" placeholder="Placeholder" />
      <Field label="With hint" hint="Hint sits under the control." />
      <Field label="With error" defaultValue="bad" error="This field is required." />
      <Field label="Disabled" disabled defaultValue="Locked" />
    </div>
  ),
};
