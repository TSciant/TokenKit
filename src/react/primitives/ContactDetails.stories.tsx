import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";
import { ContactDetails } from "./ContactDetails";

const meta = {
  title: "04 Primitives/45 Contact details",
  component: ContactDetails,
  parameters: {
    docs: {
      description: {
        component:
          "How to reach someone: an address, a phone number, an email address, opening hours and a way to get there, a line each. Details to use, not a pitch: every number and address is a real link (tel:, mailto:), each line's icon is decoration, and its kind is spoken as a word. An office card is this inside a card; a contact band with a button is a call to action.",
      },
    },
  },
  argTypes: {
    name: { control: "text" },
    address: { control: "object" },
    phone: { control: "text" },
    email: { control: "text" },
    hours: { control: "text" },
    directions: { control: "object" },
  },
  args: {
    name: "Head office",
    address: ["120 Market Street", "Suite 400", "Springfield, ST 01234"],
    phone: "+1 555 010 0199",
    email: "hello@example.com",
    hours: "Monday to Friday, 9am to 5pm",
    directions: { label: "Get directions", href: "#main" },
  },
} satisfies Meta<typeof ContactDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OfficeCards: Story = {
  name: "Office cards",
  parameters: { docs: { description: { story: "Inside cards, one per office. The card is the surface; the details are the same component." } } },
  render: () => (
    <div data-shell="grid" data-gap="4" data-cols="3">
      {[
        { name: "Head office", address: ["120 Market Street", "Springfield, ST 01234"], phone: "+1 555 010 0199" },
        { name: "North office", address: ["8 River Road", "Northfield, ST 05678"], phone: "+1 555 010 0142" },
        { name: "West office", address: ["31 Hill Avenue", "Westbury, ST 09876"], email: "west@example.com" },
      ].map((o) => (
        <Card key={o.name}>
          <ContactDetails {...o} />
        </Card>
      ))}
    </div>
  ),
};
