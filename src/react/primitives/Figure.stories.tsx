import type { Meta, StoryObj } from "@storybook/react-vite";
import { Figure } from "./Figure";

/* A synthetic plate rather than a photograph.

   This story used to point at an Unsplash URL. Three things wrong with that
   in a boilerplate: it is a network dependency, so the story is blank behind
   a firewall and the a11y run measures an empty box; it is somebody's
   licensed work sitting in a repository that will be forked per client; and
   the kit's whole position is that a wireframe ships no photography. An
   inline SVG is self-contained, weighs a few hundred bytes, and is honest
   about being a stand-in. Photography belongs under src/client/. */
const PLATE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img">
       <rect width="1600" height="900" fill="#d7d7d7"/>
       <path d="M0 900 L520 300 L900 720 L1180 520 L1600 900 Z" fill="#b9b9b9"/>
       <circle cx="1240" cy="220" r="96" fill="#c8c8c8"/>
     </svg>`.replace(/\s+/g, " "),
  );

const meta = {
  title: "04 Primitives/07 Figure",
  component: Figure,
  parameters: {
    docs: {
      description: {
        component:
          "Accessible media asset (img or video) with aspect frame, caption, and credit. Separate from Media, which is the figure-beside-body layout object. Use for: Captioned media with optional credit; editorial or case-study imagery. Don't use for: Uncaptioned UI chrome images, or interactive carousels.",
      },
    },
  },
  args: {
    src: PLATE,
    alt: "Stand-in plate in a sixteen-by-nine frame",
    caption: "The frame keeps its ratio at every container width.",
    credit: "Synthetic plate · no photography ships with the kit",
    aspect: "16/9",
  },
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {};

export const Square: Story = {
  args: { aspect: "1/1" },
};

export const Decorative: Story = {
  args: {
    decorative: true,
    alt: undefined,
    caption: undefined,
    credit: undefined,
  },
};
