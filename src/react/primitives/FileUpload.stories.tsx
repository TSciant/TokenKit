import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload, type FileUploadItem } from "./FileUpload";

const meta = {
  title: "04 Primitives/83 File upload",
  component: FileUpload,
  parameters: {
    docs: {
      description: {
        component:
          "Choose files, see each by name with where it is, remove any. Only ask for a file when the service cannot do without it. A native file input underneath, so it works without JavaScript; once the page runs, an outline button opens the picker (speech control can press it by name), and a box around it takes dropped files, never the only way in. Chosen files are listed with their size, their status as an icon and a word (Uploading, Uploaded, Not uploaded), and a Remove button that names the file; after a remove, focus moves to the next file's Remove, or back to the button. A polite region says \"2 of 3 files uploaded\" and \"File scan.heic removed\". The hint is written from accept and maxSize, one limit per sentence; accept is a hint to the picker, not validation. A file's error is also the field's error, worded as GOV.UK words them (\"The selected file must be a PDF, JPG or PNG\"). One file per field unless people need several at once. The kit uploads nothing: onAdd gets the files and the caller keeps files up to date. Not in a modal. From GOV.UK, NHS, HMRC, USWDS, MOJ, Carbon, Paste, Helsinki, Astryx, Zendesk Garden and AGDS.",
      },
    },
  },
  argTypes: {
    multiple: { control: "boolean" },
    dropzone: { control: "boolean" },
    disabled: { control: "boolean" },
    error: { control: "text" },
  },
  args: {
    label: "Proof of address",
    accept: "application/pdf,image/jpeg,image/png",
    maxSize: 10 * 1024 * 1024,
    files: [{ id: "a", name: "council-tax-2026.pdf", size: 1258291, status: "uploaded" }],
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = {
  name: "Nothing chosen yet",
  args: { files: [] },
};

export const SeveralFiles: Story = {
  name: "Several files",
  parameters: { docs: { description: { story: "One uploading with its progress, one uploaded, one that failed: its error under the row and as the field's error." } } },
  args: {
    label: "Receipts",
    multiple: true,
    error: "The selected file must be a PDF, JPG or PNG",
    files: [
      { id: "1", name: "receipt-march.pdf", size: 82000, status: "uploading", progress: 64 },
      { id: "2", name: "taxi.jpg", size: 412000, status: "uploaded" },
      { id: "3", name: "scan.heic", size: 2900000, status: "error", error: "The selected file must be a PDF, JPG or PNG" },
    ],
  },
};

export const Disabled: Story = {
  args: { files: [], disabled: true, reason: "You can add documents once your application is saved." },
};

/** Choose or drop files: each "uploads" for a moment, the region says how many are done. */
function Live() {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  useEffect(() => {
    if (!files.some((f) => f.status === "uploading")) return;
    const t = setTimeout(() => setFiles((fs) => fs.map((f) => (f.status !== "uploading" ? f : (f.progress ?? 0) >= 100 ? { ...f, status: "uploaded", progress: undefined } : { ...f, progress: (f.progress ?? 0) + 25 }))), 400);
    return () => clearTimeout(t);
  }, [files]);
  return (
    <div style={{ maxInlineSize: "36rem" }}>
      <FileUpload
        label="Receipts"
        multiple
        accept="application/pdf,image/jpeg,image/png"
        maxSize={10 * 1024 * 1024}
        files={files}
        onAdd={(added) => setFiles((fs) => [...fs, ...added.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size, status: "uploading" as const, progress: 0 }))])}
        onRemove={(id) => setFiles((fs) => fs.filter((f) => f.id !== id))}
      />
    </div>
  );
}

export const TryIt: Story = {
  name: "Try it",
  parameters: { docs: { description: { story: "Choose or drop files. Each one uploads for a moment (nothing leaves the page); the region says how many are done, and Remove moves focus on." } } },
  render: () => <Live />,
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma FileUpload laid over this one: proof of address with its drop zone, its written hint and one uploaded file, 560 wide." } },
    onion: { component: "FileUpload", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 560 }}>
      <FileUpload {...args} />
    </div>
  ),
};
