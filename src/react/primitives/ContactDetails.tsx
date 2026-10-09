import type { HTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export interface ContactDetailsProps extends HTMLAttributes<HTMLElement> {
  /** Who or where these reach: an office, a team. Optional. */
  name?: string;
  /** The postal address, one line per item. */
  address?: string[];
  /** As it should be read; the link dials the digits in it. */
  phone?: string;
  email?: string;
  /** When someone is there, in a line ("Monday to Friday, 9am to 5pm"). */
  hours?: string;
  /** A link to directions or a map. */
  directions?: { label: string; href: string };
}

function Row({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <li data-tk="contact-details-row">
      <Icon name={icon} size="sm" />
      <span>
        <span data-tk="visually-hidden">{label}: </span>
        {children}
      </span>
    </li>
  );
}

/**
 * ContactDetails — how to reach someone: an address, a phone number, an email
 * address, opening hours and a way to get there, each on its own line.
 *
 * Details to use, not a pitch: no heading of its own beyond a name, no
 * button, and every number and address a real link (tel:, mailto:) so a
 * phone dials and a mail client opens. Each line's icon is decoration; its
 * kind is spoken as a word. An office card is this inside a card; a contact
 * band with a button is a call to action.
 */
export function ContactDetails({ name, address, phone, email, hours, directions, ...rest }: ContactDetailsProps) {
  return (
    <address data-tk="contact-details" {...rest}>
      {name ? <p data-tk="contact-details-name">{name}</p> : null}
      <ul data-tk="contact-details-list">
        {address?.length ? (
          <Row icon="pin" label="Address">
            {address.map((line, i) => (
              <span key={i} data-tk="contact-details-line">
                {line}
              </span>
            ))}
          </Row>
        ) : null}
        {phone ? (
          <Row icon="phone" label="Phone">
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
          </Row>
        ) : null}
        {email ? (
          <Row icon="mail" label="Email">
            <a href={`mailto:${email}`}>{email}</a>
          </Row>
        ) : null}
        {hours ? (
          <Row icon="clock" label="Hours">
            {hours}
          </Row>
        ) : null}
        {directions ? (
          <Row icon="map" label="Directions">
            <a href={directions.href}>{directions.label}</a>
          </Row>
        ) : null}
      </ul>
    </address>
  );
}
