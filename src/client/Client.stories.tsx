import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * The client boundary.
 *
 * This section is empty, and that is the deliverable. It is where one
 * engagement's own components, compositions and brand pack go, so that the
 * kit above it stays general and a delivery can be a subset rather than
 * everything the author owns.
 */

const WHERE: [string, string, string][] = [
  ["Token contract", "src/css/core/", "—"],
  ["Grayscale packs", "src/css/packs/", "—"],
  ["A filled-in brand pack", "—", "src/client/css/"],
  ["Primitives", "src/react/primitives/", "src/client/components/"],
  ["Composed patterns", "src/react/patterns/", "src/client/components/"],
  ["Page compositions", "src/samples/", "src/client/pages/"],
];

const LADDER: [string, string][] = [
  ["A token", "Most “we need it different” is a value, and a value is a pack."],
  [
    "A prop",
    "If the difference is structural and general, add it to the kit component. That is a kit improvement, and every later engagement gets it.",
  ],
  [
    "Composition",
    "Wrap the kit component in one of yours. A wrapper that supplies this client’s defaults is five lines and costs the kit nothing.",
  ],
  [
    "A new component here",
    "Last, and only when the first three are wrong.",
  ],
];

const meta = {
  title: "09 Client/01 Read me",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Where one engagement's own work goes, and why the kit above it does not move.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadMe: Story = {
  name: "The boundary",
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ padding: "var(--tk-space-6)" }}>
      <h1 className="tk-doc-title">The client boundary</h1>
      <p className="tk-doc-note">
        Everything in the other eight sections is the kit. Everything under{" "}
        <code>src/client/</code> belongs to one engagement. The split is not
        housekeeping: work authored for a client is that client&rsquo;s work
        product and the kit is pre-existing property licensed into the
        delivery, and the cheapest way to keep two owners straight is a
        directory you can point at.
      </p>

      <h2 className="tk-doc-title" style={{ fontSize: "var(--tk-size-4)" }}>
        What goes where
      </h2>
      {/* Bare table: the `elements` layer styles it, and a doc page that
          invents its own class is a doc page proving the layer does not work.
          The region around it scrolls on a narrow screen (WCAG 1.4.10 lets a
          table scroll; the page itself must not), and is focusable so a
          keyboard can scroll it. */}
      <div role="region" aria-label="What goes where" tabIndex={0} style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            {/* The corner cell is an empty `td`, not a `th`. A header cell
                with no text fails axe's empty-table-header rule, and rightly:
                it announces a column heading and then says nothing. */}
            <td />
            <th scope="col">Kit</th>
            <th scope="col">Client</th>
          </tr>
        </thead>
        <tbody>
          {WHERE.map(([what, kit, client]) => (
            <tr key={what}>
              <th scope="row">{what}</th>
              <td>
                <code>{kit}</code>
              </td>
              <td>
                <code>{client}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="tk-doc-note">
        The test for deciding: would you build this again for the next client?
        If yes it is a primitive or a pattern and it belongs to the kit. If it
        only makes sense because of one client&rsquo;s content model, taxonomy
        or org chart, it belongs here. Promoting a component upward later is
        safe; the other direction is what quietly entangles the two, because by
        the time you notice, the kit has a prop named after somebody&rsquo;s
        product line.
      </p>

      <h2 className="tk-doc-title" style={{ fontSize: "var(--tk-size-4)" }}>
        Additive, not subtractive
      </h2>
      <p className="tk-doc-note">
        The kit ships everything; an engagement adds to it and delivers a
        subset. So add files here, do not edit files above. When a kit
        component is nearly right, reach for these in order:
      </p>
      <ol className="tk-doc-note" data-shell="stack" data-gap="2">
        {LADDER.map(([name, why]) => (
          <li key={name}>
            <strong>{name}.</strong> {why}
          </li>
        ))}
      </ol>
      <p className="tk-doc-note">
        What is never on that list is editing a kit file to suit one client.
        That is the change that cannot be delivered without delivering
        everything.
      </p>

      <h2 className="tk-doc-title" style={{ fontSize: "var(--tk-size-4)" }}>
        The check
      </h2>
      <p className="tk-doc-note">
        Today the boundary is a convention, and the check is that nothing under{" "}
        <code>src/client/</code> is imported from above it. <code>npm run boundary</code>{" "}
        prints the violations, and prints nothing when there are none. A hit
        means the kit has taken a dependency on one client&rsquo;s code and the
        delivery can no longer be a subset.
      </p>
      <p className="tk-doc-note">
        A tool that walks the import graph from a set of entry points and prunes
        everything unreachable is the obvious next step. It is deliberately not
        built: the right seams are the ones a real engagement reveals, and
        guessing at them produces a tool that is confidently wrong about which
        files are needed.
      </p>
    </div>
  ),
};
