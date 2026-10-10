import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Chip } from "./Chip";
import { Heading } from "./Heading";
import { Icon, type IconName } from "./Icon";
import { Plate } from "./Plate";

export type ProfileContacts = {
  /** Written out in full; the link opens a mail client. */
  email?: string;
  /** As it should be read; the link dials the digits in it. */
  phone?: string;
  /** Other places to find them: a profile elsewhere, a booking page. Each label says where. */
  links?: { label: string; href: string }[];
};

export interface ProfileHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "role"> {
  /** Their name, as they write it. The page's heading. */
  name: string;
  /** Letters after the name ("PhD, AICP"), shown after it in a lighter weight. */
  credentials?: string;
  /** What they do, in a line: "Head of research", "Senior designer". */
  role: string;
  /** Where they do it. */
  organisation?: string;
  /** Where they are: a city, an office. */
  location?: string;
  /** A photograph. Defaults to a portrait plate standing in for one. */
  portrait?: ReactNode;
  /** How to reach them: email and phone are real links, and each icon is decoration. */
  contacts?: ProfileContacts;
  /** About them, a paragraph per item. Two or three short ones. */
  bio?: string[];
  /** What they know about, a few words each, shown as chips. */
  expertise?: string[];
  /** The word over the expertise chips, which also names their list. */
  expertiseLabel?: string;
  /** A way back to the list they came from ("All staff"), above everything else. */
  back?: { label: string; href: string };
  /** The name's heading level: h1 on their own page (the default), h2 when the profile is a section of another. */
  level?: 1 | 2;
}

function Fact({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <li data-tk="profile-header-fact">
      <Icon name={icon} size="sm" />
      <span>
        <span data-tk="visually-hidden">{label}: </span>
        {children}
      </span>
    </li>
  );
}

/**
 * ProfileHeader — the top of a person's own page: who they are, what they
 * do and where, how to reach them, a few paragraphs about them and what they
 * know about.
 *
 * The name is the page's heading, with any letters after it in a lighter
 * weight. The portrait sits in a narrow column beside the details when the
 * container has room, and above them, smaller, when it does not; that is a
 * container query, so a profile in a sidebar stacks while one on a page sits
 * side by side. Email and phone are real links (mailto:, tel:), and every
 * icon is decoration with its kind spoken as a word. A grid of people is a
 * card collection, each card a name, a role and a link to this.
 */
export function ProfileHeader({
  name,
  credentials,
  role,
  organisation,
  location,
  portrait,
  contacts,
  bio,
  expertise,
  expertiseLabel = "Expertise",
  back,
  level = 1,
  ...rest
}: ProfileHeaderProps) {
  const id = useId();
  const expertiseId = `${id}-expertise`;
  const hasContacts = Boolean(contacts?.email || contacts?.phone || contacts?.links?.length);
  return (
    <header data-tk="profile-header" {...rest}>
      {back ? (
        <a data-tk="profile-header-back" href={back.href}>
          <Icon name="arrowLeft" size="sm" />
          {back.label}
        </a>
      ) : null}
      <div data-tk="profile-header-body">
        <div data-tk="profile-header-portrait">
          {portrait ?? <Plate ratio="4 / 5" crop="portrait" subject="person" seed={3} label={`Portrait of ${name}`} />}
        </div>
        <div data-tk="profile-header-details">
          <div data-tk="profile-header-head">
            <Heading level={level}>
              {name}
              {credentials ? <span data-tk="profile-header-credentials">, {credentials}</span> : null}
            </Heading>
            <p data-tk="profile-header-role">{role}</p>
            {organisation || location ? (
              <ul data-tk="profile-header-facts">
                {organisation ? (
                  <Fact icon="building" label="Organisation">
                    {organisation}
                  </Fact>
                ) : null}
                {location ? (
                  <Fact icon="mapPin" label="Location">
                    {location}
                  </Fact>
                ) : null}
              </ul>
            ) : null}
          </div>
          {hasContacts ? (
            <ul data-tk="profile-header-facts" data-kind="contacts">
              {contacts?.email ? (
                <Fact icon="mail" label="Email">
                  <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
                </Fact>
              ) : null}
              {contacts?.phone ? (
                <Fact icon="phone" label="Phone">
                  <a href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`}>{contacts.phone}</a>
                </Fact>
              ) : null}
              {contacts?.links?.map((l) => (
                <Fact key={l.href + l.label} icon="link" label="Link">
                  <a href={l.href}>{l.label}</a>
                </Fact>
              ))}
            </ul>
          ) : null}
          {bio?.length ? (
            <div data-tk="profile-header-bio">
              {bio.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : null}
          {expertise?.length ? (
            <div data-tk="profile-header-expertise">
              <p id={expertiseId} data-tk="profile-header-label">
                {expertiseLabel}
              </p>
              <ul aria-labelledby={expertiseId}>
                {expertise.map((e) => (
                  <li key={e}>
                    <Chip>{e}</Chip>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
