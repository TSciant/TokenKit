import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { STATUS_ICON } from "./status-icon";

export type CareLevel = "non-urgent" | "urgent" | "emergency";

const LEVEL: Record<CareLevel, { label: string; icon: IconName }> = {
  "non-urgent": { label: "Non-urgent advice", icon: STATUS_ICON.info },
  urgent: { label: "Urgent advice", icon: STATUS_ICON.warning },
  emergency: { label: "Immediate action required", icon: STATUS_ICON.danger },
};

export interface CareCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** How quickly to get care: non-urgent (a GP, a pharmacy), urgent (111), emergency (999, A&E). */
  urgency?: CareLevel;
  /** @deprecated Use urgency (level means a heading's level everywhere else in the kit); kept until the next minor release. */
  level?: CareLevel;
  /** One call to action: "Speak to a GP if:", "Call 111 if:", "Call 999 or go to A&E now if:". */
  title: string;
  headingLevel?: 2 | 3 | 4;
  /** The urgency, said before the title as part of the heading. Defaults to the urgency's words. */
  label?: string;
  /** A bulleted list of when, even for one item; then a line, if needed. */
  children?: ReactNode;
  /** Emergency only: the one link it may carry ("Find your nearest A&E"). */
  action?: { label: string; href: string };
}

/**
 * CareCard — what care to get, who to contact and how quickly.
 *
 * Three levels, told apart by the words in the heading (hidden, but read
 * first: "Urgent advice: Call 111 if:"), by the mark and by the edge, not by
 * colour alone. The heading is one call to action; the body is a bulleted
 * list of when. Order cards by how likely and how serious. An emergency card
 * may carry one action link and no other links. Built from one source, the
 * NHS service manual's care cards, and saying so: use it for care advice,
 * not for warnings (a Callout) or in a question page.
 */
export function CareCard({ urgency, level: legacyLevel, title, headingLevel = 3, label, children, action, ...rest }: CareCardProps) {
  const level = urgency ?? legacyLevel ?? "non-urgent";
  const id = useId();
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  const l = LEVEL[level];
  return (
    <div {...rest} data-tk="care-card" data-level={level} role="group" aria-labelledby={`${id}-title`}>
      <H data-tk="care-card-title" id={`${id}-title`}>
        <Icon name={l.icon} />
        <span><span data-tk="visually-hidden">{label ?? l.label}: </span>{title}</span>
      </H>
      <div data-tk="care-card-body">
        {children}
        {level === "emergency" && action ? (
          <a data-tk="care-card-action" href={action.href}>
            <Icon name="arrowRight" size="sm" />
            {action.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}
