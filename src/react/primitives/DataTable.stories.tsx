import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "./DataTable";
import { Heading } from "./Heading";

const meta = {
  title: "04 Primitives/52 Table",
  component: DataTable,
  parameters: {
    docs: {
      description: {
        component:
          "Data that is a table: rows of the same kind of thing compared across the same columns. A real table, with a caption that names it, column headers and, when one column names each row, row headers, so a screen reader never reads a figure without what it is a figure of. Figures line up and end-align. On a narrow container the table scrolls sideways inside a region named by its caption, which takes keyboard focus so it can be scrolled without a mouse. For data only, never for layout; a list of key and value pairs is a description list.",
      },
    },
  },
  argTypes: {
    caption: { control: "text" },
    captionHidden: { control: "boolean" },
    columns: { control: "object" },
    rows: { control: "object" },
    rowHeader: { control: "text" },
    striped: { control: "boolean" },
    dense: { control: "boolean" },
  },
  args: {
    caption: "Sign-ups by region, first half of 2026",
    captionHidden: false,
    rowHeader: "region",
    striped: false,
    dense: false,
    columns: [
      { key: "region", label: "Region" },
      { key: "q1", label: "January to March", align: "end" },
      { key: "q2", label: "April to June", align: "end" },
      { key: "change", label: "Change", align: "end" },
    ],
    rows: [
      { region: "North", q1: "1,204", q2: "1,388", change: "+15.3%" },
      { region: "South", q1: "986", q2: "1,041", change: "+5.6%" },
      { region: "East", q1: "1,532", q2: "1,467", change: "−4.2%" },
      { region: "West", q1: "748", q2: "903", change: "+20.7%" },
      { region: "All regions", q1: "4,470", q2: "4,799", change: "+7.4%" },
    ],
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;

export const WideAndDense: Story = {
  name: "Wide, striped and dense",
  parameters: {
    docs: {
      description: {
        story:
          "Seven figure columns in a container 22rem wide. The table keeps its columns and scrolls sideways inside its region; tab to it and the arrow keys scroll it. Striped, because the rows are long; dense, because it is all figures.",
      },
    },
  },
  args: {
    caption: "Visits by site, per month",
    rowHeader: "site",
    striped: true,
    dense: true,
    columns: [
      { key: "site", label: "Site" },
      ...MONTHS.map((m) => ({ key: m, label: m, align: "end" as const })),
      { key: "total", label: "Total", align: "end" },
    ],
    rows: [
      { site: "Central library", Jan: "3,120", Feb: "2,984", Mar: "3,402", Apr: "3,215", May: "3,377", Jun: "2,860", total: "18,958" },
      { site: "Riverside", Jan: "1,045", Feb: "998", Mar: "1,130", Apr: "1,087", May: "1,152", Jun: "1,010", total: "6,422" },
      { site: "Hill Road", Jan: "820", Feb: "791", Mar: "866", Apr: "902", May: "934", Jun: "877", total: "5,190" },
      { site: "Market Square", Jan: "2,210", Feb: "2,187", Mar: "2,355", Apr: "2,298", May: "2,402", Jun: "2,154", total: "13,606" },
      { site: "Northfield", Jan: "640", Feb: "655", Mar: "702", Apr: "689", May: "731", Jun: "668", total: "4,085" },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: "22rem" }}>
        <Story />
      </div>
    ),
  ],
};

export const UnderAHeading: Story = {
  name: "Under a heading",
  parameters: {
    docs: {
      description: {
        story:
          "The heading above already names the table to sight, so the caption is kept for screen readers only. It still names the table and its region. Words only, so every column is start-aligned; the site column is given a width so the hours share the rest.",
      },
    },
  },
  args: {
    caption: "Opening hours by site",
    captionHidden: true,
    rowHeader: "site",
    columns: [
      { key: "site", label: "Site", width: "12rem" },
      { key: "weekdays", label: "Monday to Friday" },
      { key: "saturday", label: "Saturday" },
      { key: "sunday", label: "Sunday" },
    ],
    rows: [
      { site: "Central library", weekdays: "8am to 8pm", saturday: "9am to 5pm", sunday: "11am to 4pm" },
      { site: "Riverside", weekdays: "9am to 6pm", saturday: "9am to 1pm", sunday: "Closed" },
      { site: "Hill Road", weekdays: "9am to 5pm", saturday: "Closed", sunday: "Closed" },
    ],
  },
  render: (args) => (
    <div data-shell="stack" data-gap="3">
      <Heading level={2} text="heading-m">
        Opening hours
      </Heading>
      <DataTable {...args} />
    </div>
  ),
};
