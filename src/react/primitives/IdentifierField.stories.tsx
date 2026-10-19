import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IdentifierField, IDENTIFIER_FORMATS, formatIdentifier, identifierMessages, isValidIdentifier, type IdentifierFormat } from "./IdentifierField";

const FORMATS = Object.keys(IDENTIFIER_FORMATS) as IdentifierFormat[];

const meta = {
  title: "04 Primitives/80 Identifier field",
  component: IdentifierField,
  parameters: {
    docs: {
      description: {
        component:
          "One input for a fixed-format reference: a National Insurance number, an NHS number, a Unique Taxpayer Reference, a VAT registration number, an EORI number, an employer PAYE reference, an Accounts Office reference, a sort code or an account number. A Field with the reference's full name as the label (never an abbreviation), a published example that belongs to no one as the hint, and a width that fits it. It takes the value however it is typed, spaces, dashes and lower case included, and has no maxlength to cut a paste short: clean it with normaliseIdentifier before checking, check it with isValidIdentifier, and show it back with formatIdentifier, in the way it is written rather than the way it was typed. One input, never a box per group. Use only when the service needs the reference, make it optional or give another route where you can, and never use one to verify who someone is. Where to find the reference goes in the page above the field, not in the hint and not behind a Disclosure. From GOV.UK, the NHS service manual and HMRC's patterns.",
      },
    },
  },
  argTypes: {
    format: { control: "select", options: FORMATS },
    label: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    optional: { control: "boolean" },
  },
  args: { format: "nino" },
} satisfies Meta<typeof IdentifierField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const EveryFormat: Story = {
  name: "Every format",
  parameters: { docs: { description: { story: "Each preset with its full name, its example and its width. Numeric references bring up a number keyboard; the ones with letters do not." } } },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "36rem" }}>
      {FORMATS.map((f) => <IdentifierField key={f} format={f} />)}
    </div>
  ),
};

export const WithAnError: Story = {
  name: "With an error",
  parameters: { docs: { description: { story: "The message as the patterns word it: identifierMessages gives the missing and the wrong-format message for each preset." } } },
  args: { format: "nino", defaultValue: "QQ 12 34 56", error: identifierMessages("nino").format },
};

/** Typed loosely, checked once cleaned, shown back the way it is written. */
function ShownBack() {
  const [raw, setRaw] = useState("qq123456 c");
  const ok = isValidIdentifier("nino", raw);
  return (
    <div data-shell="stack" data-gap="4" style={{ maxInlineSize: "36rem" }}>
      <IdentifierField format="nino" value={raw} onChange={(e) => setRaw(e.currentTarget.value)} error={raw && !ok ? identifierMessages("nino").format : undefined} />
      <p style={{ margin: 0 }}>{ok ? <>Shown back as <strong style={{ whiteSpace: "nowrap" }}>{formatIdentifier("nino", raw)}</strong></> : "Not yet a National Insurance number."}</p>
    </div>
  );
}

export const TypedLooselyShownBack: Story = {
  name: "Typed loosely, shown back",
  parameters: { docs: { description: { story: "Lower case, missing and extra spaces are all accepted; the value is shown back in its written form, on one line." } } },
  render: () => <ShownBack />,
};

export const WhereToFindIt: Story = {
  name: "Where to find it",
  parameters: { docs: { description: { story: "Help on where to find the reference is body content above the field, not hint text and not a Disclosure. The field here is optional, with another route offered." } } },
  render: () => (
    <div data-shell="stack" data-gap="4" style={{ maxInlineSize: "36rem" }}>
      <p style={{ margin: 0 }}>You can find your NHS number on an NHS letter, a prescription or in the NHS App. If you do not have it, you can leave this blank and give your date of birth instead.</p>
      <IdentifierField format="nhs" optional />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma IdentifierField laid over this one: the National Insurance number with its example, 480 wide." } },
    onion: { component: "IdentifierField", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 480 }}>
      <IdentifierField {...args} />
    </div>
  ),
};
