import { useState, type FormEvent } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { ChoiceGroup } from "./ChoiceGroup";
import { ErrorSummary, type ErrorSummaryItem } from "./ErrorSummary";
import { Field } from "./Field";

const meta = {
  title: "04 Primitives/76 Error summary",
  component: ErrorSummary,
  parameters: {
    docs: {
      description: {
        component:
          "The list of what went wrong, at the top of the page, after a form is submitted with mistakes. Use whenever there is a validation error, even one. Don't use for a failure that is not about a field (a sign-in that did not work, a service that is down: an Alert), or instead of the error beside each field: it repeats them, worded exactly the same. Titled \"There is a problem\", every error a link to its field; it takes focus when it appears, and puts \"Error: \" at the start of the page's title while it is shown, so a screen reader hears it at once. A link focuses the field and brings its label (or its group's legend) into view; linked to a ChoiceGroup's id, it goes to the first option. Put it above the page's heading, below any breadcrumbs or back link. Field takes an `id` for these links.",
      },
    },
  },
  argTypes: {
    errors: { control: "object" },
    title: { control: "text" },
    description: { control: "text" },
    focusOnShow: { control: "boolean" },
    titlePrefix: { control: "text" },
  },
  /* Off in the panel, so a docs page with several summaries on it does not jump to the last; the form story shows it on. */
  args: {
    title: "There is a problem",
    focusOnShow: false,
    titlePrefix: "Error: ",
    errors: [
      { text: "Enter your full name", href: "#full-name" },
      { text: "Select how you'd like us to contact you", href: "#contact" },
    ],
  },
} satisfies Meta<typeof ErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* A question page after Continue was pressed with nothing filled in. */
function QuestionPage() {
  const check = (name: string, contact: string): ErrorSummaryItem[] => [
    ...(name.trim() ? [] : [{ text: "Enter your full name", href: "#full-name" }]),
    ...(contact ? [] : [{ text: "Select how you'd like us to contact you", href: "#contact" }]),
  ];
  const [errors, setErrors] = useState<ErrorSummaryItem[]>(() => check("", ""));
  const message = (href: string) => errors.find((e) => e.href === href)?.text;
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setErrors(check(String(data.get("name") ?? ""), String(data.get("contact") ?? "")));
  };
  return (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "36rem" }}>
      <ErrorSummary errors={errors} titlePrefix={false} />
      <h1 style={{ margin: 0 }}>Your details</h1>
      <form noValidate onSubmit={submit} data-shell="stack" data-gap="5">
        <Field id="full-name" name="name" label="Full name" autoComplete="name" error={message("#full-name")} />
        <ChoiceGroup
          id="contact"
          name="contact"
          legend="How should we contact you?"
          error={message("#contact")}
          options={[
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone" },
            { value: "post", label: "Post" },
          ]}
        />
        <div>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </div>
  );
}

export const InAForm: Story = {
  name: "In a form",
  parameters: {
    docs: {
      description: {
        story:
          "After Continue with nothing filled in: the summary above the heading, the same words beside each field. Its links go to the name field and the first contact option, with the label and legend in view. Fill one in and press Continue: the summary keeps only what is still wrong, and goes when nothing is. (The page title is left alone here; a real page lets the summary add \"Error: \".)",
      },
    },
  },
  render: () => <QuestionPage />,
};

export const OneError: Story = {
  name: "One error",
  parameters: { docs: { description: { story: "Shown for a single error too: the reader still lands on it and follows its link." } } },
  args: { errors: [{ text: "Enter a date of birth that is in the past", href: "#dob-day" }] },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Error summary laid over this one: two errors, 480 wide, without the focus ring." } },
    onion: { component: "ErrorSummary", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 480 }}>
      <ErrorSummary {...args} focusOnShow={false} titlePrefix={false} />
    </div>
  ),
};
