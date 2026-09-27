import type { ComponentType, SVGProps } from "react";
import { icons } from "./icon-set";

/**
 * Icon.
 *
 * Lucide's icons are ISC (MIT for the ones it inherited from Feather). They
 * arrive with react-icons and aren't copied into the kit, but anything built
 * from it contains them, so their licence sits beside this file
 * (lucide.LICENSE) for a build to carry.
 *
 * The glyphs live in icon-set.ts, which is generated and verified against the
 * installed react-icons — see that file for why the set is Lucide and why it
 * is curated rather than exhaustive.
 *
 * Two things this component deliberately does NOT do.
 *
 * It does not set a colour. Lucide ships `stroke="currentColor"` and
 * `fill="none"`, so an icon is already the ink of whatever it sits in, and a
 * component that set its own colour would be the one element on the page a
 * brand swap could not reach.
 *
 * It does not set a stroke width. That is `--tk-icon-stroke`, and it works
 * because Lucide puts the weight in a PRESENTATION ATTRIBUTE
 * (`stroke-width="2"` on the root svg) rather than in an inline style.
 * Presentation attributes sit below every author rule in the cascade, so one
 * line of CSS in icon.css overrides all 221 glyphs, and a pack that wants
 * heavier icons says so once. An inline style would have won instead and the
 * token would have been unreachable.
 */

export type IconName = keyof typeof icons;

/**
 * The names, as a value, exported from the module that owns the map.
 *
 * The Catalogue story used to do `Object.keys(icons)` on the imported map,
 * and under Storybook's chunking that identifier resolved to the module
 * NAMESPACE rather than to the const — so the keys came back as the module's
 * export names and `icons["icons"]` was an object. React was handed an object
 * as an element type and threw #130, which is why that one story rendered
 * nothing while the component itself worked everywhere else.
 *
 * Deriving the list here removes the module boundary the ambiguity lived on,
 * and gives callers a stable, typed order instead of enumeration order.
 */
export const ICON_NAMES = Object.keys(icons) as IconName[];

export type IconSize = "sm" | "md" | "lg";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "children"> {
  name: IconName;
  size?: IconSize;
  /** Decorative by default. Pass a string only when the icon is the sole label. */
  label?: string;
}

/**
 * Size is an attribute and the box is a token.
 *
 * This used to be `const SIZE_PX = { sm: 16, md: 20, lg: 24 }` and
 * `width={px} height={px}` — three numbers in TypeScript that a pack could
 * not reach, a root font size could not move, and a reader at 200% zoom did
 * not benefit from. The attribute gate found the tail of it: `data-size` was
 * on the element and no selector in the kit answered it, so the attribute
 * looked like the API and was decoration.
 *
 * Now `--tk-icon-sm/md/lg` are the box, in rem, and this component only says
 * which one. md is the base rule's, so it is left off the element.
 */
export function Icon({ name, size = "md", label, className, ...rest }: IconProps) {
  const Cmp = icons[name] as ComponentType<SVGProps<SVGSVGElement>>;
  const decorative = !label;

  // Guard: if icon name is invalid (type safety bypass), render nothing instead of crashing
  if (!Cmp) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Icon: Unknown icon name "${name}". Available names: ${ICON_NAMES.slice(0, 5).join(", ")}...`);
    }
    return null;
  }

  return (
    <Cmp
      data-tk="icon"
      data-size={size === "md" ? undefined : size}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={label}
      focusable="false"
      className={className}
      {...rest}
    />
  );
}
