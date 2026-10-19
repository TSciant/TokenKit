import type { Meta, StoryObj } from "@storybook/react-vite";
import { ResourceDownload } from "./ResourceDownload";

const meta = {
  title: "04 Primitives/60 Resource download",
  component: ResourceDownload,
  parameters: {
    docs: {
      description: {
        component:
          "A file a reader can take away: a report, a slide deck, a recording. Its title is the link, and under it what the reader is about to get: the format, the size and how long it is. Don't use a button that only says Download: out of context a screen reader's list of links reads Download, Download, Download. The format and size are written next to the link, not hidden in it, so everyone reads the same thing. When a file may not work with assistive technology, give a way to ask for another format.",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
    href: { control: "text" },
    format: { control: "text" },
    size: { control: "text" },
    length: { control: "text" },
    date: { control: "text" },
    dateLabel: { control: "text" },
    description: { control: "text" },
    download: { control: "boolean" },
    alternativeHref: { control: "text" },
    alternativeLabel: { control: "text" },
    level: { control: "inline-radio", options: [2, 3, 4] },
    locale: { control: "inline-radio", options: ["en-US", "en-GB", "fr-FR", "de-DE"] },
  },
  args: {
    title: "A year of shorter waits: the full report",
    href: "#main",
    format: "PDF",
    size: "2.4 MB",
    length: "36 pages",
    date: "2026-06-30",
    description: "The method, the numbers by month, and what each service changed.",
    download: false,
    level: 3,
    locale: "en-US",
  },
} satisfies Meta<typeof ResourceDownload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AList: Story = {
  name: "A list of files",
  parameters: {
    docs: {
      description: {
        story:
          "Files from one event in a list: slides, a recording and a data file. The tiles are one size whatever the file, so the titles line up. The deck may not suit assistive technology, so it offers another format.",
      },
    },
  },
  render: () => (
    <ul data-shell="stack" data-gap="5" style={{ listStyle: "none", margin: 0, padding: 0, maxInlineSize: "40rem" }}>
      <li>
        <ResourceDownload title="Opening session slides" href="#main" format="PowerPoint" size="8.1 MB" length="22 slides" alternativeHref="#main" />
      </li>
      <li>
        <ResourceDownload title="Panel recording" href="#main" format="MP3" size="41 MB" length="58 minutes" description="Audio only. A transcript is on the event page." />
      </li>
      <li>
        <ResourceDownload title="Waiting times by month" href="#main" format="CSV" size="96 KB" download date="2026-06-30" />
      </li>
    </ul>
  ),
};

export const Narrow: Story = {
  name: "A narrow box",
  parameters: {
    docs: { description: { story: "Under 22rem the tile shrinks to an icon and the format is read from the line under the title." } },
  },
  render: (args) => (
    <div style={{ maxInlineSize: "18rem" }}>
      <ResourceDownload {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma ResourceDownload laid over this one: the PDF report (format, size, length, date and a description), 560 wide." } },
    onion: { component: "ResourceDownload", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 560 }}>
      <ResourceDownload {...args} />
    </div>
  ),
};
