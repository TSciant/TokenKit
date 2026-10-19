import type { Meta, StoryObj } from "@storybook/react-vite";
import { LanguageSwitcher } from "./LanguageSwitcher";

const meta = {
  title: "04 Primitives/88 Language switcher",
  component: LanguageSwitcher,
  parameters: {
    docs: {
      description: {
        component:
          "Links to the same page in other languages, each in its own name (\"Cymraeg\", not \"Welsh\") and marked with its language, so a reader who knows none of the page's language still finds theirs and a screen reader says each in the right voice; the page's own language shows as the current one. Hidden words can say \"Change the language to …\" in the language linked to. The landmark's name is in the page's language (\"Language\", \"Iaith\"). Past a few, the rest go behind a menu, the primary ones staying in view. Links, not a button: it is navigation. Put it in the same place on every page; it goes to the same page and keeps what was typed. It translates nothing: only offer a language the service is fully written in. From GOV.UK, USWDS, HMRC and Helsinki.",
      },
    },
  },
  args: {
    label: "Language",
    languages: [
      { code: "en", name: "English", href: "#main", current: true },
      { code: "cy", name: "Cymraeg", href: "#main", describe: "Newid yr iaith i'r Gymraeg" },
    ],
  },
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnTheWelshPage: Story = {
  name: "On the Welsh page",
  args: {
    label: "Iaith",
    languages: [
      { code: "en", name: "English", href: "#main", describe: "Change the language to English" },
      { code: "cy", name: "Cymraeg", href: "#main", current: true },
    ],
  },
};

export const ManyLanguages: Story = {
  name: "Many languages",
  parameters: { docs: { description: { story: "Three in view, the rest behind a menu named in the page's language; a right-to-left name keeps its direction." } } },
  args: {
    label: "Kieli",
    moreLabel: "Lisää kieliä",
    languages: [
      { code: "fi", name: "Suomi", href: "#main", current: true },
      { code: "sv", name: "Svenska", href: "#main" },
      { code: "en", name: "English", href: "#main" },
      { code: "ru", name: "Русский", href: "#main" },
      { code: "et", name: "Eesti", href: "#main" },
      { code: "ar", name: "العربية", href: "#main", dir: "rtl" },
    ],
  },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma LanguageSwitcher laid over this one: English, current, and Cymraeg." } },
    onion: { component: "LanguageSwitcher", skin: () => "default.png" },
  },
};
