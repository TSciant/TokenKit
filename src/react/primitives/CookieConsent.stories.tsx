import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { CookieConsent } from "./CookieConsent";
import { Guidance, GuidancePair } from "./Guidance";

const meta = {
  title: "04 Primitives/55 Cookie consent",
  component: CookieConsent,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The banner that asks whether non-essential cookies may be set, before any are. A region named by its heading, with the message, a link to the cookie policy, and three actions: Accept all and Reject non-essential, the same variant and the same size because they are equal answers, and a quieter Cookie settings. It never decides and stores nothing: the choice goes to the host through onAccept or onReject. After a choice it says what was chosen, with a Hide button, and focus moves to that line (GOV.UK's banner does the same). Fixed to the bottom of the viewport by default, or the top, and while fixed it adds its height to the page's scroll padding so focus is not hidden under it. These stories use `contained`, which puts it in the flow. Use for: the first visit, before any non-essential cookie. Don't use for: news, offers, or a sign-up (a banner that sometimes sells is one people learn to dismiss unread).",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
    level: { control: "inline-radio", options: [2, 3] },
    children: { control: "text" },
    policyHref: { control: "text" },
    policyLabel: { control: "text" },
    settingsHref: { control: "text" },
    acceptLabel: { control: "text" },
    rejectLabel: { control: "text" },
    settingsLabel: { control: "text" },
    hideLabel: { control: "text" },
    choice: { control: "inline-radio", options: [undefined, "accepted", "rejected"] },
    acceptedMessage: { control: "text" },
    rejectedMessage: { control: "text" },
    position: { control: "inline-radio", options: ["bottom", "top"] },
    contained: { control: "boolean" },
    onAccept: { action: "accept" },
    onReject: { action: "reject" },
    onSettings: { action: "settings" },
    onHide: { action: "hide" },
  },
  args: {
    title: "Cookies on this site",
    children:
      "We use some essential cookies to make this site work. We'd also like to set analytics cookies to understand how it is used. We won't set them unless you say yes.",
    policyHref: "#cookie-policy",
    policyLabel: "Read the cookie policy",
    position: "bottom",
    contained: true,
  },
} satisfies Meta<typeof CookieConsent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AfterAChoice: Story = {
  name: "After a choice",
  parameters: {
    docs: {
      description: {
        story:
          "The question gives way to one line saying what was chosen, and a Hide button. Focus moves to that line when the choice is made in the banner (not when the host passes `choice`, as here), so the answer is heard rather than lost with the buttons. With `settingsHref`, the line links back to the settings.",
      },
    },
  },
  render: (args) => (
    <div data-shell="stack" data-gap="5">
      {/* Two on one page want two names; a real page has one banner. */}
      <CookieConsent {...args} choice="accepted" settingsHref="#cookie-settings" aria-label="Cookie consent, accepted" />
      <CookieConsent {...args} choice="rejected" settingsHref="#cookie-settings" aria-label="Cookie consent, rejected" />
    </div>
  ),
};

export const SettingsPage: Story = {
  name: "Settings on a page of their own",
  args: {
    title: "Cookies on Example Store",
    settingsHref: "#cookie-settings",
    children: (
      <>
        <p>We use essential cookies to keep your basket and sign you in.</p>
        <p>
          With your permission we'd also use cookies to measure how the site is used and to remember
          your preferences. You can change your mind at any time.
        </p>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "With `settingsHref`, Cookie settings is a link to a settings page and works without script. The message can be more than one paragraph; keep it to what the reader needs to answer, and leave the detail to the policy.",
      },
    },
  },
};

export const UsingCookieConsent: Story = {
  name: "Using cookie consent",
  render: () => (
    <GuidancePair>
      <Guidance
        tone="do"
        note="Give accept and reject the same weight: one variant, one size, side by side. They are two answers to one question."
      >
        <CookieConsent contained policyHref="#cookie-policy">
          We'd like to set analytics cookies to understand how this site is used.
        </CookieConsent>
      </Guidance>
      <Guidance
        tone="dont"
        note="Don't make yes a button and no a link to a settings page. That decides for the reader, and where consent is the law it is not consent."
      >
        {/* A deliberately unequal banner, drawn by hand: CookieConsent will
            not render one. */}
        <section data-tk="cookie-consent" data-contained="" aria-label="Unequal cookie banner (example)">
          <div data-tk="cookie-consent-inner">
            <p data-tk="cookie-consent-message">
              We use cookies to give you the best experience.
            </p>
            <div data-tk="cookie-consent-actions">
              <Button variant="solid" size="lg">
                Accept and continue
              </Button>
              <Button variant="quiet" size="sm">
                Manage options
              </Button>
            </div>
          </div>
        </section>
      </Guidance>
    </GuidancePair>
  ),
};
