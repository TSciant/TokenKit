import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorPage } from "./ErrorPage";

const meta = {
  title: "04 Primitives/87 Error page",
  component: ErrorPage,
  parameters: {
    docs: {
      description: {
        component:
          "The page that says a page is missing, the service has a problem, or the service is closed, and what to do. Three kinds, each with tested words: not-found (\"Page not found\", and how to check the address), problem (\"Sorry, there is a problem with the service\", \"Try again later.\", one page for every unexpected problem, shown briefly) and unavailable (\"Sorry, the service is unavailable\", with the day, date and time it is back, or what to do if it has closed for good). Add what happened to their answers, how to get help (a link to a page with numbers and opening times, or the details themselves), another service they can use, and at most one way on. It keeps the site's usual header and footer, without breadcrumbs. No error code or jargon, no humour, no red, no blame; the server still sends the real status. serviceName sets the document title; focusOnShow moves focus to the heading after a client-side route change. Not for a form's errors (ErrorSummary) or for planned downtime while the service still works (an Alert). From GOV.UK, HMRC, CMS and AGDS.",
      },
    },
  },
  argTypes: { kind: { control: "inline-radio", options: ["not-found", "problem", "unavailable"] } },
  args: { kind: "not-found", action: { label: "Go to the homepage", href: "#main" } },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Problem: Story = {
  name: "A problem with the service",
  args: {
    kind: "problem",
    action: undefined,
    answers: "We saved your answers. They will be available for 30 days.",
    contact: <p>If you need to finish today, <a href="#main">contact the helpline</a> (Monday to Friday, 8am to 6pm).</p>,
  },
};

export const Unavailable: Story = {
  name: "Unavailable until a set time",
  args: {
    kind: "unavailable",
    action: undefined,
    availableFrom: "9am on Monday 3 November 2026",
    answers: "Your saved applications have not been affected.",
    contact: <p><a href="#main">Contact the helpline</a> (Monday to Friday, 8am to 6pm) if you need to speak to someone.</p>,
  },
};

export const ClosedForGood: Story = {
  name: "Closed for good",
  args: {
    kind: "unavailable",
    action: undefined,
    children: <p>This service closed on 30 September 2026.</p>,
    alternative: { label: "Apply using the new service", href: "#main" },
  },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma ErrorPage laid over this one: page not found, with its two lines and one way on, 640 wide." } },
    onion: { component: "ErrorPage", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 640 }}>
      <ErrorPage {...args} />
    </div>
  ),
};
