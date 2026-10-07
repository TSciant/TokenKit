import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field, type FieldProps } from "./Field";
import { Guidance, GuidancePair } from "./Guidance";

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
    maxChars: { control: "number", description: "A character limit shown as a count; never truncates." },
    reveal: { control: "boolean", description: "Password fields only: the Show / Hide button (on by default)." },
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

export const OnionSkinWidths: Story = {
  name: "Onion skin: widths (Figma)",
  parameters: {
    docs: { description: { story: "One field at each width (chars 2, 3, 4, 5, 10, 20, 30) at 320px, for the Figma FieldWidths component to be laid over. Figma draws them at the tk pack; the code sizes them in ch of the pack's font plus padding." } },
    onion: { component: "FieldWidths", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ inlineSize: 320 }}>
      <Field label="Day" chars={2} />
      <Field label="Security code" chars={3} />
      <Field label="Year" chars={4} />
      <Field label="Quantity" chars={5} />
      <Field label="Postcode" chars={10} />
      <Field label="Phone number" chars={20} />
      <Field label="Reference" chars={30} />
    </div>
  ),
};

export const OnionSkinReadOnly: Story = {
  name: "Onion skin: optional and read-only (Figma)",
  parameters: {
    docs: { description: { story: "An optional field, a read-only input and a read-only textarea at 320px, for the Figma FieldReadOnly component to be laid over." } },
    onion: { component: "FieldReadOnly", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ inlineSize: 320 }}>
      <Field label="Company" optional />
      <Field label="Account number" readOnly defaultValue="40-12-77 31926540" />
      <Field label="Notes" control="textarea" readOnly defaultValue="Set when the account was opened." />
    </div>
  ),
};

/**
 * A password field shows what was typed on request.
 */
export const Password: Story = {
  name: "Password (show and hide)",
  parameters: {
    docs: {
      description: {
        story:
          "A `type=\"password\"` Field gets a Show button: seeing what you typed is how you catch the typo before the form rejects it. The button says Show or Hide and is named for what it does (\"Show password\"); a polite status line says the password is visible; spellcheck and autocorrect stay off while it is shown; submitting the form hides it again. Pass `autoComplete` (current-password, or new-password when creating one) so password managers fill and save it. `reveal={false}` removes the button where the value must never be shown.",
      },
    },
  },
  render: () => (
    <form data-shell="stack" data-gap="5" style={{ maxInlineSize: "26rem" }} onSubmit={(e) => e.preventDefault()}>
      <Field label="Password" type="password" autoComplete="current-password" />
      <Field label="New password" type="password" autoComplete="new-password" hint="At least 12 characters." />
    </form>
  ),
};

/* For Figma: a password field, hidden, at 320. */
export const OnionSkinPassword: Story = {
  name: "Onion skin: password (Figma)",
  parameters: {
    docs: { description: { story: "A password field at 320px, for the Figma FieldPassword component to be laid over." } },
    onion: { component: "FieldPassword", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div style={{ inlineSize: 320 }}>
      <Field label="Password" type="password" autoComplete="current-password" />
    </div>
  ),
};

/**
 * A limit you can see, and that never cuts you off.
 */
export const CharacterCount: Story = {
  name: "Character count",
  parameters: {
    docs: {
      description: {
        story:
          "`maxChars` shows a count under the field. It starts as the limit (\"You can enter up to 200 characters\"), then counts down; past the limit it says how many too many and the field takes the error border, but nothing typed is cut off (the native maxlength would truncate a paste without saying so). Screen readers hear the limit as the field's description, and the count once typing pauses, only in the last fifth or over. The second field starts over the limit.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "32rem" }}>
      <Field label="Describe the problem" control="textarea" maxChars={200} />
      <Field label="Short title" maxChars={30} defaultValue="Containers answer to their own box, not the window" />
    </div>
  ),
};

/* For Figma: a textarea with a count, empty, at 320. */
export const OnionSkinCount: Story = {
  name: "Onion skin: character count (Figma)",
  parameters: {
    docs: { description: { story: "A textarea with a 200-character limit at 320px, for the Figma FieldCount component to be laid over." } },
    onion: { component: "FieldCount", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div style={{ inlineSize: 320 }}>
      <Field label="Describe the problem" control="textarea" maxChars={200} />
    </div>
  ),
};

const FieldRule = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section data-shell="stack" data-gap="3">
    <h2 style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>{title}</h2>
    {children}
  </section>
);

/**
 * How to ask a question with a field.
 *
 * From the ds-corpus input brief (Carbon, Primer, GOV.UK, Base Web), in our
 * words, with live Fields so the guidance stays true when Field changes.
 */
export const UsingFields: Story = {
  name: "Using fields",
  parameters: {
    docs: {
      description: {
        story:
          "The rules for asking with a field, each with its reason, as Do and Don't pairs of live Fields. Drawn from the ds-corpus input brief: GOV.UK on labels, placeholders, widths and errors; Carbon on marking the minority and on read-only; Base Web on helping the browser.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ maxInlineSize: "56rem" }}>
      <FieldRule title="A label you can always see">
        <GuidancePair>
          <Guidance tone="do" note="Every field has a visible label above it, short and in sentence case, with no colon. It is still there after someone has typed, which is when they check what they typed against what was asked.">
            <Field label="Email address" type="email" autoComplete="email" />
          </Guidance>
          <Guidance tone="dont" note="Don't use the placeholder as the label. It vanishes on the first keystroke, leaving a filled box with no question; not every screen reader reads it; and its pale text usually fails contrast. This example has a hidden name so the page passes its checks, which a sighted reader never sees.">
            <input data-tk="input" type="email" placeholder="Email address" aria-label="Email address" />
          </Guidance>
        </GuidancePair>
      </FieldRule>

      <FieldRule title="Size the box to the answer">
        <GuidancePair>
          <Guidance tone="do" note="Use chars when the answer has a known length. A four-character box says a year is wanted before anyone reads the label twice.">
            <Field label="Year of birth" chars={4} inputMode="numeric" autoComplete="bday-year" />
          </Guidance>
          <Guidance tone="dont" note="Don't stretch a short answer across the page. A full-width box for a year reads as a request for more than a year, and the eye has to travel to find where to type.">
            <Field label="Year of birth" inputMode="numeric" autoComplete="bday-year" />
          </Guidance>
        </GuidancePair>
      </FieldRule>

      <FieldRule title="Mark the minority">
        <GuidancePair>
          <Guidance tone="do" note="When most fields are required, mark the few that are optional, in words. The reader learns one exception instead of decoding a mark on every line.">
            <div data-shell="stack" data-gap="4">
              <Field label="Full name" autoComplete="name" />
              <Field label="Email address" type="email" autoComplete="email" />
              <Field label="Company" optional autoComplete="organization" />
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't put an asterisk on every field. When everything is marked, the mark carries no information, and an asterisk on its own means nothing until someone finds the key.">
            <div data-shell="stack" data-gap="4">
              <Field label="Full name" required autoComplete="name" />
              <Field label="Email address" required type="email" autoComplete="email" />
              <Field label="Company" required autoComplete="organization" />
            </div>
          </Guidance>
        </GuidancePair>
      </FieldRule>

      <FieldRule title="Say what went wrong, and how to fix it">
        <GuidancePair>
          <Guidance tone="do" note="Put the error next to the field and write it as an instruction: what is wrong and what a right answer looks like. The reader can fix it without reading anything else.">
            <Field label="Email address" type="email" autoComplete="email" defaultValue="name.example.com" error="Enter an email address in the correct format, like name@example.com" />
          </Guidance>
          <Guidance tone="dont" note="Don't say Invalid input. It tells the reader they failed and not why, so they guess, resubmit, and fail again.">
            <Field label="Email address" type="email" autoComplete="email" defaultValue="name.example.com" error="Invalid input." />
          </Guidance>
        </GuidancePair>
      </FieldRule>

      <FieldRule title="Read-only, not disabled, when the value matters">
        <GuidancePair>
          <Guidance tone="do" note="If the reader needs to see a value they cannot change, make it read-only and say why. It stays readable at full contrast, reachable by keyboard, and is sent with the form.">
            <Field label="Account number" readOnly defaultValue="40-12-77 31926540" hint="Set when the account was opened." />
          </Guidance>
          <Guidance tone="dont" note="Don't disable a field to show a value. Disabled text is faint by design, a keyboard cannot reach it, a screen reader may skip it, and the value is not submitted.">
            <Field label="Account number" disabled defaultValue="40-12-77 31926540" />
          </Guidance>
        </GuidancePair>
      </FieldRule>

      <FieldRule title="Let the browser help">
        <GuidancePair>
          <Guidance tone="do" note="Set type, autoComplete and inputMode. The browser fills what it already knows, a phone shows the right keyboard, and people who find typing hard type less. Leave paste alone, and leave the field empty unless there is a reason to pre-fill it.">
            <Field label="Phone number" type="tel" autoComplete="tel" inputMode="tel" chars={20} />
          </Guidance>
          <Guidance tone="dont" note="Don't leave a phone number as plain text with no hints, and never block paste on a field (a confirm-your-email box most of all). It looks the same and works worse: no autofill, a letter keyboard on a phone, and a password manager that cannot help.">
            <Field label="Phone number" chars={20} onPaste={(e) => e.preventDefault()} />
          </Guidance>
        </GuidancePair>
      </FieldRule>
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
