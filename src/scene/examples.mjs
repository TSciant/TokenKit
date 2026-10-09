/**
 * Example scenes. Three small screens a product would actually build, written
 * as data. Between them they use every kind in the vocabulary, so drawing
 * them draws every kind, and tools/scene-gate.mjs fails if one stops being
 * clean (a note means the kit moved and the example did not) or a kind
 * appears in none of them.
 */

export const EXAMPLES = [
  {
    title: "Pricing card",
    brand: "tk",
    root: {
      kind: "card",
      children: [
        {
          kind: "card-header",
          eyebrow: "Most popular",
          subtitle: "For teams of up to ten",
          children: [{ kind: "card-title", text: "Pro" }],
        },
        { kind: "text", look: "metric", text: "$24 a month" },
        {
          kind: "card-body",
          text: "Every pack, every pattern, and the gates that keep them honest, for the whole team.",
        },
        {
          kind: "inline",
          gap: 2,
          children: [
            { kind: "chip", icon: "check", text: "Six packs" },
            { kind: "chip", icon: "check", text: "Figma library" },
            { kind: "chip", emphasis: "quiet", text: "Billed yearly" },
          ],
        },
        {
          kind: "card-footer",
          children: [
            {
              kind: "button-group",
              text: "Plan actions",
              children: [
                { kind: "button", variant: "solid", text: "Choose Pro" },
                { kind: "button", variant: "quiet", text: "Compare plans" },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    title: "Sign-up hero",
    brand: "tk",
    root: {
      kind: "split",
      gap: 6,
      align: "center",
      children: [
        {
          kind: "stack",
          gap: 4,
          children: [
            { kind: "eyebrow", text: "New in 2026" },
            {
              kind: "heading",
              level: 1,
              look: "display",
              text: "Ship the brand, not the rebuild",
            },
            {
              kind: "text",
              look: "lead",
              text: "One set of components, dressed by a pack. Change the pack and the whole product changes with it.",
            },
            {
              kind: "row",
              gap: 3,
              children: [
                {
                  kind: "button",
                  variant: "solid",
                  size: "lg",
                  icon: "arrowRight",
                  iconPosition: "trailing",
                  text: "Start free",
                },
                {
                  kind: "button",
                  variant: "outline",
                  size: "lg",
                  text: "See pricing",
                },
              ],
            },
          ],
        },
        { kind: "media", ratio: "4 / 3", label: "The product, on a laptop" },
      ],
    },
  },
  {
    title: "Settings form",
    brand: "tk",
    root: {
      kind: "sidebar",
      gap: 6,
      children: [
        {
          kind: "stack",
          gap: 2,
          align: "start",
          children: [
            {
              kind: "row",
              gap: 2,
              align: "center",
              children: [
                { kind: "icon", icon: "settings" },
                { kind: "eyebrow", emphasis: "quiet", text: "Settings" },
              ],
            },
            { kind: "divider" },
            { kind: "button", variant: "quiet", icon: "user", text: "Profile" },
            {
              kind: "button",
              variant: "quiet",
              icon: "bell",
              text: "Notifications",
            },
            {
              kind: "button",
              variant: "quiet",
              icon: "lock",
              text: "Security",
            },
          ],
        },
        {
          kind: "stack",
          children: [
            {
              kind: "center",
              width: "narrow",
              children: [
                {
                  kind: "stack",
                  gap: 5,
                  children: [
                    { kind: "heading", level: 2, text: "Notifications" },
                    {
                      kind: "alert",
                      status: "info",
                      title: "Changes save as you go",
                      text: "You can change these at any time.",
                    },
                    {
                      kind: "field",
                      label: "Email address",
                      type: "email",
                      hint: "Where we send the digest",
                    },
                    {
                      kind: "field",
                      label: "Language",
                      control: "select",
                      options: ["English", "Español", "Français"],
                    },
                    {
                      kind: "choice-group",
                      text: "How often?",
                      columns: 3,
                      children: [
                        {
                          kind: "choice",
                          text: "Daily",
                          description: "A short note every morning",
                        },
                        {
                          kind: "choice",
                          text: "Weekly",
                          meta: "Recommended",
                          description: "Everything on Monday",
                        },
                        {
                          kind: "choice",
                          text: "Never",
                          description: "Only what needs you",
                        },
                      ],
                    },
                    {
                      kind: "grid",
                      cols: 2,
                      gap: 3,
                      children: [
                        {
                          kind: "card",
                          variant: "flat",
                          children: [
                            { kind: "card-title", text: "Mentions" },
                            {
                              kind: "card-body",
                              text: "When someone names you.",
                            },
                          ],
                        },
                        {
                          kind: "card",
                          variant: "flat",
                          children: [
                            { kind: "card-title", text: "Releases" },
                            { kind: "card-body", text: "When the kit ships." },
                          ],
                        },
                      ],
                    },
                    {
                      kind: "button-group",
                      text: "Form actions",
                      children: [
                        { kind: "button", variant: "solid", text: "Save" },
                        {
                          kind: "button",
                          variant: "quiet",
                          tone: "danger",
                          text: "Turn everything off",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    title: "Landing page",
    brand: "wireframe",
    root: {
      kind: "stack",
      gap: 0,
      children: [
        { kind: "section", type: "site-header", variant: "inline" },
        {
          kind: "section",
          type: "hero",
          variant: "split",
          eyebrow: "New",
          heading: "Plan the whole project in one place",
          body: "Budgets, people and deadlines side by side, so nothing waits on a spreadsheet.",
          actions: ["Start free", "See a demo"],
          media: "Product screen",
        },
        { kind: "section", type: "card-collection", variant: "grid-3", heading: "What teams use it for" },
        { kind: "section", type: "call-to-action", variant: "split", heading: "Ready when you are", body: "Set up takes ten minutes.", actions: ["Start free"] },
        { kind: "section", type: "site-footer", variant: "simple" },
      ],
    },
  },
];
