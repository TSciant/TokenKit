import { Field, type FieldProps } from "./Field";

/**
 * The fixed-format references a service asks for. Each preset is what the
 * published patterns say about that reference: its full name (never an
 * abbreviation), a safe example (never a real person's), the keyboard, how
 * long it is, how to clean it and how to show it back.
 */
export type IdentifierFormat =
  | "nino"
  | "nhs"
  | "utr"
  | "vat"
  | "eori"
  | "paye"
  | "aor"
  | "sort-code"
  | "account-number";

type Preset = {
  /** The reference's full name, for the label. */
  name: string;
  /** The same in running text, with its article, for the error messages. */
  noun: [string, string];
  /** A published example that belongs to no one. */
  example: string;
  chars: 10 | 20;
  numeric?: boolean;
  letters?: boolean;
  /** The value with everything that is not part of it taken out. */
  clean: (raw: string) => string;
  /** Is the cleaned value one of these? */
  valid: (clean: string) => boolean;
  /** The cleaned value as it is written, for showing it back. */
  show: (clean: string) => string;
};

const alnum = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const digits = (s: string) => s.replace(/\D/g, "");
const groups = (s: string, sizes: number[]) => {
  const out: string[] = [];
  let i = 0;
  for (const n of sizes) { if (i >= s.length) break; out.push(s.slice(i, i + n)); i += n; }
  if (i < s.length) out.push(s.slice(i));
  return out.join(" ");
};

/* An NHS number's last digit checks the first nine (modulus 11). */
const nhsCheck = (d: string) => {
  if (!/^\d{10}$/.test(d)) return false;
  const sum = [...d.slice(0, 9)].reduce((a, c, i) => a + Number(c) * (10 - i), 0);
  const check = 11 - (sum % 11);
  return (check === 11 ? 0 : check) === Number(d[9]) && check !== 10;
};

export const IDENTIFIER_FORMATS: Record<IdentifierFormat, Preset> = {
  nino: { noun: ["a", "National Insurance number"], name: "National Insurance number", example: "QQ 12 34 56 C", chars: 20, letters: true, clean: alnum, valid: (c) => /^[A-Z]{2}\d{6}[A-D]$/.test(c), show: (c) => groups(c, [2, 2, 2, 2, 1]) },
  nhs: { noun: ["an", "NHS number"], name: "NHS number", example: "999 123 4567", chars: 20, numeric: true, clean: digits, valid: nhsCheck, show: (c) => groups(c, [3, 3, 4]) },
  utr: { noun: ["a", "Unique Taxpayer Reference"], name: "Unique Taxpayer Reference", example: "1234567890", chars: 20, letters: true, clean: (s) => digits(s).slice(-10), valid: (c) => /^\d{10}$/.test(c), show: (c) => c },
  vat: { noun: ["a", "VAT registration number"], name: "VAT registration number", example: "123456789", chars: 20, letters: true, clean: (s) => alnum(s).replace(/^GB/, ""), valid: (c) => /^(\d{9}|\d{12})$/.test(c), show: (c) => c },
  eori: { noun: ["an", "EORI number"], name: "EORI number", example: "GB123456123456", chars: 20, letters: true, clean: alnum, valid: (c) => /^[A-Z]{2}[A-Z0-9]{1,15}$/.test(c), show: (c) => c },
  paye: { noun: ["an", "employer PAYE reference"], name: "Employer PAYE reference", example: "123/AB456", chars: 20, letters: true, clean: (s) => s.toUpperCase().replace(/[^A-Z0-9/]/g, ""), valid: (c) => /^\d{3}\/?[A-Z0-9]{1,10}$/.test(c), show: (c) => (c.includes("/") ? c : `${c.slice(0, 3)}/${c.slice(3)}`) },
  aor: { noun: ["an", "Accounts Office reference"], name: "Accounts Office reference", example: "123PX00123456", chars: 20, letters: true, clean: alnum, valid: (c) => /^\d{3}P[A-Z]\d{7}[0-9X]$/.test(c), show: (c) => c },
  "sort-code": { noun: ["a", "sort code"], name: "Sort code", example: "309430", chars: 10, numeric: true, clean: digits, valid: (c) => /^\d{6}$/.test(c), show: (c) => groups(c, [2, 2, 2]) },
  "account-number": { noun: ["an", "account number"], name: "Account number", example: "00733445", chars: 10, numeric: true, clean: digits, valid: (c) => /^\d{6,8}$/.test(c), show: (c) => c },
};

/** Take out the spaces, dashes, case and padding people type, before checking. */
export const normaliseIdentifier = (format: IdentifierFormat, raw: string) => IDENTIFIER_FORMATS[format].clean(raw);
/** Is it one, however it was typed? */
export const isValidIdentifier = (format: IdentifierFormat, raw: string) => IDENTIFIER_FORMATS[format].valid(normaliseIdentifier(format, raw));
/** As it is written, for showing it back (not the way it was typed). Keep it on one line. */
export const formatIdentifier = (format: IdentifierFormat, raw: string) => IDENTIFIER_FORMATS[format].show(normaliseIdentifier(format, raw));

/** The error messages, worded as the patterns word them. */
export const identifierMessages = (format: IdentifierFormat) => {
  const [article, noun] = IDENTIFIER_FORMATS[format].noun;
  return { missing: `Enter your ${noun}`, format: `Enter ${article} ${noun} in the correct format` };
};

export interface IdentifierFieldProps extends Omit<FieldProps, "label" | "hint" | "chars" | "control"> {
  format: IdentifierFormat;
  /** Defaults to the reference's full name. Name the owner when it is not the reader's ("Anycompany's employer PAYE reference"). */
  label?: string;
  /** Defaults to "For example, " and the published example. The hint says what it looks like, not where to find it: that goes in the page above. */
  hint?: string | false;
  chars?: FieldProps["chars"];
}

/**
 * IdentifierField — one input for a fixed-format reference: a National
 * Insurance number, an NHS number, a tax or VAT reference, a sort code.
 *
 * A Field sized to the reference, with its full name as the label and a safe
 * example as the hint. It takes the value however it is typed (spaces,
 * dashes, lower case) and has no maxlength to cut a paste short: clean it
 * with `normaliseIdentifier` before checking, and show it back with
 * `formatIdentifier`. One input, never a box per group. Spellcheck is off;
 * the keyboard is numeric only for references that are digits alone.
 */
export function IdentifierField({ format, label, hint, chars, ...rest }: IdentifierFieldProps) {
  const p = IDENTIFIER_FORMATS[format];
  return (
    <Field
      label={label ?? p.name}
      hint={hint === false ? undefined : hint ?? `For example, ${p.example}`}
      chars={chars ?? p.chars}
      spellCheck={false}
      autoCapitalize={p.letters ? "characters" : "off"}
      autoCorrect="off"
      inputMode={p.numeric ? "numeric" : "text"}
      data-identifier={format}
      {...rest}
    />
  );
}
