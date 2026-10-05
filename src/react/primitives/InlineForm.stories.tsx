import type { Meta, StoryObj } from "@storybook/react-vite";
import { InlineForm } from "./InlineForm";

const meta = {
  title: "04 Primitives/30 Inline form",
  component: InlineForm,
  parameters: {
    docs: {
      description: {
        component:
          "One field and its submit button on one line: newsletter sign-ups, \"get the guide\" boxes and the input-capture hero. A real form (Enter submits; works without JavaScript given an `action`), a real label (visible unless `hideLabel`, and even then it is the field's name), hint and error tied to the field. The row wraps to a stack when the box is too narrow, field first. Use for: a single-field capture or lookup. Don't use for: more than one field (use Field in a form), or search in the header (HeaderSearch).",
      },
    },
  },
  args: {
    label: "Email address",
    submitLabel: "Subscribe",
    onSubmit: (e) => e.preventDefault(),
  },
  argTypes: {
    type: { control: "inline-radio", options: ["email", "text", "search", "tel", "url"] },
    hideLabel: { control: "boolean" },
    busy: { control: "boolean" },
    hint: { control: "text" },
    error: { control: "text" },
    onSubmit: { control: false },
    inputProps: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof InlineForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithHintAndError: Story = {
  name: "Hint and error",
  args: { hint: "One email a month. Unsubscribe from any of them.", error: "Enter an email address like name@example.com." },
};

export const Narrow: Story = {
  name: "In a narrow box (wraps)",
  decorators: [(Story) => <div style={{ inlineSize: 240 }}><Story /></div>],
};

export const WithConsent: Story = {
  name: "With a consent line",
  render: (args) => (
    <InlineForm {...args}>
      <p data-tk="field-hint" style={{ margin: 0 }}>
        We use your address only to send the newsletter. <a href="#privacy">Privacy notice</a>
      </p>
    </InlineForm>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { hint: "One email a month." },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one at 400px, without and with an error. Switch Onion in the toolbar; error in Controls picks the skin." } },
    onion: { component: "InlineForm", target: "root", skin: (a: Record<string, unknown>) => (a.error ? "error.png" : "default.png") },
  },
  decorators: [(Story) => <div style={{ inlineSize: 400 }}><Story /></div>],
};
