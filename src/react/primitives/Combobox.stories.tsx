import type { Meta, StoryObj } from "@storybook/react-vite";
import { Combobox, type ComboboxOption } from "./Combobox";

const STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AS", "American Samoa"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["GU", "Guam"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["MP", "Northern Mariana Islands"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["PR", "Puerto Rico"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VI", "U.S. Virgin Islands"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];
const STATE_OPTIONS: ComboboxOption[] = STATES.map(([code, name]) => ({ value: code, label: name, keywords: [code] }));

const COMPONENTS = ["Accordion", "Agenda", "Alert", "ArticleMeta", "AudioPlayer", "Avatar", "BackLink", "Breadcrumbs", "Button", "ButtonGroup", "Callout", "Card", "CaseStudy", "ChatPanel", "Chip", "ChoiceGroup", "Code", "Combobox", "ContactDetails", "CookieConsent", "DataTable", "DateInput", "DestructiveConfirm", "Drawer", "EmptyState", "ErrorSummary", "Field", "FileUpload", "Heading", "IdentifierField", "LinkList", "MenuButton", "Modal", "Pager", "PhaseBanner", "Pricing", "Quote", "SectionHeading", "Skeleton", "Spinner", "Steps", "Switch", "Tabs", "Toast", "Tooltip", "VideoPlayer"].map((c) => ({ value: c, label: c }));

const meta = {
  title: "04 Primitives/86 Combobox",
  component: Combobox,
  parameters: {
    docs: {
      description: {
        component:
          "Type to narrow a long list, then choose: a text box with a list of suggestions (the W3C APG editable combobox, list autocomplete, chosen by hand). For more than 15 options; fewer is a select (Field control=\"select\"), and on a phone a select is often kinder. Focus stays in the text box: Down and Up move a highlight through the list (opening it when closed), Enter or a click chooses and puts the cursor at the end, Escape closes and then clears, Alt+Down opens without moving, Alt+Up closes, Home, End, Left and Right go back to editing. The value changes only when something is chosen, never as the highlight moves, and typing never replaces what was typed. The number of matches is said when typing pauses. Options can be found by other words (\"DC\"). Without allowCustom, leaving with text that is not an option puts the last choice back; with it (a search), the text is the value. No placeholder, and nothing submits on choosing. From the W3C APG, Paste, USWDS, CMS, Zendesk Garden and Astryx.",
      },
    },
  },
  argTypes: { kind: { control: "inline-radio", options: ["select", "search"] }, allowCustom: { control: "boolean" }, openOnFocus: { control: "boolean" } },
  args: { label: "State or territory", hint: "Type a name or an abbreviation", options: STATE_OPTIONS, chars: 30 },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Chosen: Story = {
  name: "With a choice",
  args: { defaultValue: "DC" },
};

export const Search: Story = {
  name: "Search, free text allowed",
  parameters: { docs: { description: { story: "kind search: the magnifier at the start and no chevron; allowCustom, so whatever is typed is the value when nothing is chosen." } } },
  args: { label: "Find a component", hint: undefined, options: COMPONENTS, kind: "search", allowCustom: true, emptyText: "No components match", chars: 30 },
};

export const WithAnError: Story = {
  name: "With an error",
  args: { error: "Select a state or territory from the list" },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Combobox laid over this one: closed, with District of Columbia chosen, 480 wide." } },
    onion: { component: "Combobox", skin: () => "default.png" },
  },
  args: { defaultValue: "DC", chars: undefined },
  render: (args) => (
    <div style={{ inlineSize: 480 }}>
      <Combobox {...args} />
    </div>
  ),
};
