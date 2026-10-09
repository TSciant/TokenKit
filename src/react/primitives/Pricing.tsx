import type { HTMLAttributes } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";
import { Icon } from "./Icon";

export type PricingPlan = {
  name: string;
  /** As it should read: "$40", "From $1,200", "Free", "Ask us". */
  price: string;
  /** What the price is per: "a month", "per project". Optional. */
  period?: string;
  /** Who it is for, in a line. */
  summary?: string;
  /** What it includes, one short line each. */
  features: string[];
  /** The one thing to do about this plan. */
  action: { label: string; href: string };
  /** The plan to suggest: marked in words, and its action is the solid one. */
  recommended?: boolean;
};

export interface PricingProps extends HTMLAttributes<HTMLUListElement> {
  plans: PricingPlan[];
  /** The word on the recommended plan. */
  recommendedLabel?: string;
  /** Each plan name's heading level: h3 under a section's h2 (the default), h4 one deeper. */
  level?: 3 | 4;
}

/**
 * Pricing — plans side by side: each a name, a price and what it is per, who
 * it is for, what it includes and one action.
 *
 * A list of cards, one per plan, that wraps to as many columns as fit. The
 * recommended plan says so in words above its name and gets the solid button;
 * nothing about it depends on colour. Features are ticked lines, and a plan's
 * action names the plan for a screen reader.
 */
export function Pricing({ plans, recommendedLabel = "Recommended", level = 3, ...rest }: PricingProps) {
  return (
    <ul data-tk="pricing" {...rest}>
      {plans.map((plan) => (
        <Card key={plan.name} as="li" data-recommended={plan.recommended ? "" : undefined}>
          <div data-tk="pricing-head">
            {plan.recommended ? <Eyebrow>{recommendedLabel}</Eyebrow> : null}
            <Heading level={level} text="heading-s">
              {plan.name}
            </Heading>
            <p data-tk="pricing-price">
              <span data-tk="pricing-amount">{plan.price}</span>
              {plan.period ? <span data-tk="pricing-period"> {plan.period}</span> : null}
            </p>
            {plan.summary ? <p data-tk="pricing-summary">{plan.summary}</p> : null}
          </div>
          <ul data-tk="pricing-features">
            {plan.features.map((f) => (
              <li key={f}>
                <Icon name="check" size="sm" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <span data-tk="pricing-action">
            <Button href={plan.action.href} variant={plan.recommended ? "solid" : "outline"}>
              {plan.action.label}
              <span data-tk="visually-hidden"> {plan.name}</span>
            </Button>
          </span>
        </Card>
      ))}
    </ul>
  );
}
