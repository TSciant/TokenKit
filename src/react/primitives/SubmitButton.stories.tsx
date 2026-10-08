import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "./Field";
import { SubmitButton } from "./SubmitButton";

const meta = {
  title: "04 Primitives/39 Submit button",
  component: SubmitButton,
  parameters: {
    docs: {
      description: {
        component:
          "A form's submit button that shows it is working. While its form submits (React's form status) it is busy: the label changes to busyLabel and that is announced, a second press does nothing, and focus stays on it. Without JavaScript it is an ordinary submit button. Guard against a double submission on the server too. Drawn from a members' message board built on the kit, whose first double post came 2.8 seconds after the first, from a button that gave no sign it had been pressed. Use for: the submit button of any form that goes to a server.",
      },
    },
  },
  argTypes: {
    busyLabel: { control: "text" },
    busy: { control: "boolean" },
    variant: { control: "inline-radio", options: ["solid", "outline", "quiet"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    full: { control: "boolean" },
    children: { control: "text" },
  },
  args: { busyLabel: "Posting…", children: "Post it" },
  render: (args) => (
    <form
      action={async () => {
        await new Promise((r) => setTimeout(r, 2500));
      }}
      data-shell="stack"
      data-gap="4"
      style={{ maxInlineSize: "28rem" }}
    >
      <Field label="Your message" control="textarea" rows={2} />
      <div>
        <SubmitButton {...args} />
      </div>
    </form>
  ),
} satisfies Meta<typeof SubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
