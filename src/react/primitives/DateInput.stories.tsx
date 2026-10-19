import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateInput } from "./DateInput";

const meta = {
  title: "04 Primitives/78 Date input",
  component: DateInput,
  parameters: {
    docs: {
      description: {
        component:
          "A date someone already knows (a birthday, the date a passport was issued) in three short fields: day, month and year, in a fieldset whose legend is the question, each part with its own small label and sized to its answer. Use for a known date. Don't use for choosing a date to book or schedule (a date picker, with typing still allowed), or for a date people can only guess at to the day (ask for month and year: `parts`). Text fields with a numeric keypad, never number fields; focus never jumps on by itself, so a reader can go back and correct a part. Give an example in the hint in the fields' order. An error is said once under the hint; `errorParts` borders only the parts in error (\"Date of birth must include a month\"), otherwise the whole date. `birthday` tells autofill it is the reader's own date of birth. `order` puts the month first for US readers; `monthAs=\"select\"` offers month names. The parts' ids are `${id}-day` and so on, so an ErrorSummary can link to the first part in error.",
      },
    },
  },
  argTypes: {
    legend: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    errorParts: { control: "check", options: ["day", "month", "year"] },
    parts: { control: "check", options: ["day", "month", "year"] },
    order: { control: "inline-radio", options: ["dmy", "mdy"] },
    monthAs: { control: "inline-radio", options: ["input", "select"] },
    monthNames: { control: "object" },
    birthday: { control: "boolean" },
    id: { control: "text" },
    name: { control: "text" },
    value: { control: "object" },
    defaultValue: { control: "object" },
    onChange: { action: "changed" },
    required: { control: "boolean" },
    words: { control: "object" },
  },
  args: {
    legend: "What is your date of birth?",
    hint: "For example, 27 3 2007",
    order: "dmy",
    monthAs: "input",
    birthday: true,
    id: "dob",
    name: "dob",
  },
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const MissingPart: Story = {
  name: "With an error in one part",
  parameters: { docs: { description: { story: "Only the part in error takes the error border, and the message says which part." } } },
  args: { error: "Date of birth must include a month", errorParts: ["month"], defaultValue: { day: "27", year: "2007" } },
};

export const WholeDate: Story = {
  name: "With an error in the whole date",
  parameters: { docs: { description: { story: "Nothing entered, or a date that cannot be right in more than one part: the whole date is marked." } } },
  args: { error: "Enter your date of birth" },
};

export const MonthAndYear: Story = {
  name: "Month and year only",
  parameters: { docs: { description: { story: "For a date people only know roughly: the day is not asked for." } } },
  args: { legend: "When did you lose your passport?", hint: "For example, 12 2023", parts: ["month", "year"], birthday: false, id: "lost", name: "lost" },
};

export const MonthFirst: Story = {
  name: "Month first, with month names",
  parameters: { docs: { description: { story: "US order, the month as a select of names, as USWDS's memorable date does it. Day and year stay text fields: a select is harder to use for those." } } },
  args: { order: "mdy", monthAs: "select", hint: "For example, January 19 2000" },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Date input laid over this one: the date of birth question, empty, 400 wide." } },
    onion: { component: "DateInput", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 400 }}>
      <DateInput {...args} />
    </div>
  ),
};
