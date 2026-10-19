import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { SessionTimeout, SessionTimeoutWarning } from "./SessionTimeout";

const meta = {
  title: "04 Primitives/89 Session timeout",
  component: SessionTimeout,
  parameters: {
    docs: {
      description: {
        component:
          "Warn before a session ends for inactivity, and let people stay without losing anything (WCAG 2.2.1: a time limit under 20 hours has to be extendable, with at least 20 seconds' notice). Any activity restarts the clock; by default the session ends after 15 minutes and the warning comes 2 minutes before. The warning is a dialog: the time left in words (seconds only in the last minute), what will happen to their answers, a button to stay that takes focus, and the way out as a link; Escape and Close mean stay, a click outside does nothing. Inside it, a status region says the time every 15 seconds and every second in the last 20. Staying calls onExtend, a keep-alive that does not reload the page; the end calls onTimeout, which goes to a page saying what happened (\"We signed you out\", or for an unsigned form \"For your security, we deleted your answers\") with a way to start again. Never sign anyone out without the warning. syncTabs keeps tabs of the same service in step. From HMRC, MOJ, CMS and USWDS.",
      },
    },
  },
  args: { onExtend: () => {}, onTimeout: () => {}, signOutHref: "#main" },
} satisfies Meta<typeof SessionTimeout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A 30-second session that warns after 5 seconds of doing nothing. */
function Demo({ variant }: { variant: "signed-in" | "anonymous" }) {
  const [state, setState] = useState<"in" | "out">("in");
  if (state === "out")
    return (
      <div data-shell="stack" data-gap="3" style={{ maxInlineSize: "36rem" }}>
        <h2 style={{ margin: 0 }}>{variant === "signed-in" ? "We signed you out" : "For your security, we deleted your answers"}</h2>
        <p style={{ margin: 0 }}>{variant === "signed-in" ? "You have not done anything for 30 seconds, so we signed you out to keep your information secure." : "You have not done anything for 30 seconds, so we deleted your answers to keep them secure."}</p>
        <div><Button onClick={() => setState("in")}>{variant === "signed-in" ? "Sign in again" : "Start again"}</Button></div>
      </div>
    );
  return (
    <div style={{ maxInlineSize: "36rem" }}>
      <p style={{ margin: 0 }}>This session lasts 30 seconds without activity and warns after 5. Keep still to see the warning.</p>
      <SessionTimeout variant={variant} timeout={30} warnBefore={25} signOutHref="#main" onExtend={() => new Promise((r) => setTimeout(r, 400))} onTimeout={() => setState("out")} answers={variant === "signed-in" ? <p style={{ margin: 0 }}>We will save your answers.</p> : undefined} />
    </div>
  );
}

export const SignedIn: Story = {
  name: "Signed in (try it)",
  render: () => <Demo variant="signed-in" />,
};

export const Anonymous: Story = {
  name: "Not signed in (try it)",
  render: () => <Demo variant="anonymous" />,
};

/* The dialog on its own, with its own panel: the meta is SessionTimeout's, so these are declared here. */
export const TheWarning: StoryObj<typeof SessionTimeoutWarning> = {
  name: "The warning, two minutes left",
  render: (args) => <SessionTimeoutWarning {...args} answers={<p style={{ margin: 0 }}>We will save your answers.</p>} />,
  argTypes: {
    open: { control: "boolean" },
    remaining: { control: { type: "number", min: 0, step: 5 }, description: "Seconds left." },
    variant: { control: "inline-radio", options: ["signed-in", "anonymous"] },
    title: { control: "text" },
    message: { control: false, description: "In place of the variant's sentence; gets the time left in words." },
    extendLabel: { control: "text" },
    signOutLabel: { control: "text" },
    signOutHref: { control: "text" },
    answers: { control: false, description: "What happens to what they entered." },
    onExtend: { control: false },
    busy: { control: "boolean" },
    announcement: { control: "text", description: "Words for the status region inside the dialog." },
  },
  args: { open: true, remaining: 120, variant: "signed-in", signOutHref: "#main", onExtend: () => {} },
};

export const LastSeconds: Story = {
  name: "The warning, the last minute",
  render: () => <SessionTimeoutWarning open variant="anonymous" remaining={45} signOutHref="#main" onExtend={() => {}} />,
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma SessionTimeout laid over this one: the signed-in warning with two minutes left and the answers line, drawn inside the dialog." } },
    onion: { component: "SessionTimeout", skin: () => "default.png" },
  },
  render: () => <SessionTimeoutWarning open remaining={120} signOutHref="#main" onExtend={() => {}} answers={<p style={{ margin: 0 }}>We will save your answers.</p>} />,
};
