import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { SignIn } from "./SignIn";

const meta = {
  title: "04 Primitives/74 Sign in",
  component: SignIn,
  parameters: {
    docs: {
      description: {
        component:
          "A form that signs someone in: an email address and a password, Sign in, and a way back for someone who has forgotten. Use in front of what is private or personal. Don't use in front of anything public (let people read it without an account), or ask for anything a sign-in does not need. The fields tell a password manager what they are (autocomplete username and current-password); the password can be shown to catch a typo, and paste is never blocked. A failed attempt is said once, above the form, with focus moved to it; both fields are marked and the password is emptied, and the message never says which field was wrong, because that tells someone guessing which half they have. The remember checkbox says what it remembers. Other ways in (single sign-on, a passkey) go under the form after a divider.",
      },
    },
  },
  argTypes: {
    heading: { control: "text" },
    headingLevel: { control: "inline-radio", options: [1, 2] },
    intro: { control: "text" },
    notice: { control: false },
    error: { control: "text" },
    usernameLabel: { control: "text" },
    usernameType: { control: "inline-radio", options: ["email", "text"] },
    passwordLabel: { control: "text" },
    remember: { control: "text" },
    forgotHref: { control: "text" },
    forgotLabel: { control: "text" },
    submitLabel: { control: "text" },
    alternatives: { control: false },
    alternativesLabel: { control: "text" },
    footer: { control: false },
    action: { control: "text" },
    onSubmit: { action: "submitted" },
  },
  args: {
    heading: "Sign in",
    headingLevel: 1,
    usernameLabel: "Email address",
    usernameType: "email",
    passwordLabel: "Password",
    remember: "Remember my email address on this device",
    forgotLabel: "Forgot your password?",
    submitLabel: "Sign in",
    onSubmit: (e) => e.preventDefault(),
  },
} satisfies Meta<typeof SignIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Failed: Story = {
  name: "After a failed attempt",
  parameters: {
    docs: {
      description: {
        story:
          "The message names neither field, both take the error border, focus moves to the message and the password is empty again. Give five to ten attempts before locking an account.",
      },
    },
  },
  args: { error: "The email address or password is not right. Check them and try again, or reset your password." },
};

export const SessionExpired: Story = {
  name: "Signed out for inactivity",
  parameters: {
    docs: {
      description: {
        story: "A notice above the form says why they are here. Signing back in should return them to the page they were on.",
      },
    },
  },
  args: {
    notice: (
      <Alert tone="info" title="You were signed out">
        <p>You were signed out after 30 minutes without activity, to keep your account safe.</p>
      </Alert>
    ),
  },
};

export const OtherWaysIn: Story = {
  name: "With other ways in",
  parameters: {
    docs: {
      description: { story: "Single sign-on or a passkey under the form, after a divider, and a line for people without an account." },
    },
  },
  args: {
    alternatives: (
      <div data-shell="stack" data-gap="2">
        <Button variant="outline" full>
          Sign in with your organisation
        </Button>
        <Button variant="outline" full>
          Use a passkey
        </Button>
      </div>
    ),
    footer: (
      <>
        New here? <a href="#create">Create an account</a>
      </>
    ),
  },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Sign in laid over this one: the default form, 400 wide." } },
    onion: { component: "SignIn", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 400 }}>
      <SignIn {...args} />
    </div>
  ),
};
