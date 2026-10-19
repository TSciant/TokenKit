import type { Meta, StoryObj } from "@storybook/react-vite";
import { CareCard } from "./CareCard";

const meta = {
  title: "04 Primitives/93 Care card",
  component: CareCard,
  parameters: {
    docs: {
      description: {
        component:
          "What care to get, who to contact and how quickly, on a page of care advice. Built from one source, the NHS service manual's care cards, and saying so. Three levels: non-urgent (\"Speak to a GP if:\"), urgent (\"Call 111 if:\") and emergency (\"Call 999 or go to A&E now if:\"). The level is said first, hidden, as part of the heading (\"Urgent advice: Call 111 if:\"), because not everyone recognises a card by its colour; here the mark and the edge also differ, so the grey packs hold it too. The heading is one call to action; the body is a bulleted list of when, even for one item, specific rather than vague (\"a child aged 5 years or younger\"); an urgent card can end with a catch-all. Order cards by how likely and how serious, use as few as the page needs (to reassure, not scare), and give the text after a card its own heading. An emergency card may carry one action link and no other links. Not for warnings (a Callout), and not in a question page.",
      },
    },
  },
  argTypes: { level: { control: "inline-radio", options: ["non-urgent", "urgent", "emergency"] } },
  args: {
    level: "non-urgent",
    title: "Speak to a GP if:",
    children: (
      <ul>
        <li>your headache keeps coming back</li>
        <li>painkillers do not help and your headache gets worse</li>
      </ul>
    ),
  },
} satisfies Meta<typeof CareCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const URGENT = (
  <ul>
    <li>you have a headache and a very high temperature</li>
    <li>you have a headache after a head injury</li>
    <li>you are worried about a headache and not sure what to do</li>
  </ul>
);

export const ThreeLevels: Story = {
  name: "The three levels, in order",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <CareCard level="non-urgent" title="Speak to a GP if:">
        <ul>
          <li>your headache keeps coming back</li>
          <li>painkillers do not help and your headache gets worse</li>
        </ul>
      </CareCard>
      <CareCard level="urgent" title="Call 111 if:">{URGENT}</CareCard>
      <CareCard level="emergency" title="Call 999 or go to A&E now if:" action={{ label: "Find your nearest A&E", href: "#main" }}>
        <ul>
          <li>they have been knocked out</li>
          <li>they are being sick after a head injury</li>
        </ul>
      </CareCard>
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma CareCard laid over this one: the urgent card with three reasons, 560 wide." } },
    onion: { component: "CareCard", skin: () => "default.png" },
  },
  args: { level: "urgent", title: "Call 111 if:", children: URGENT },
  render: (args) => (
    <div style={{ inlineSize: 560 }}>
      <CareCard {...args} />
    </div>
  ),
};
