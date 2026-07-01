import { z } from "zod";

/**
 * The structured storefront object — the core IP output of the voice pipeline.
 * Mirrors the `storefronts` table in the PRD data model. Every field is
 * nullable (never optional) so structured-output mode treats them as required
 * but lets Claude emit `null` instead of hallucinating missing shop details.
 */

export const DAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const dayHoursSchema = z
  .object({
    // 24-hour "HH:MM"
    open: z.string().nullable(),
    close: z.string().nullable(),
  })
  .nullable();

const hoursSchema = z
  .object({
    mon: dayHoursSchema,
    tue: dayHoursSchema,
    wed: dayHoursSchema,
    thu: dayHoursSchema,
    fri: dayHoursSchema,
    sat: dayHoursSchema,
    sun: dayHoursSchema,
  })
  .nullable();

const productSchema = z.object({
  name: z.string(),
  price: z.string().nullable(),
  note: z.string().nullable(),
});

export const storefrontSchema = z.object({
  name: z.string().nullable(),
  tagline: z.string().nullable(),
  about: z.string().nullable(),
  category: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  address: z.string().nullable(),
  hours: hoursSchema,
  products: z.array(productSchema),
  /** ISO-639 hint for the dominant input language: "hi" | "pa" | "en". */
  language: z.string().nullable(),
});

export type Storefront = z.infer<typeof storefrontSchema>;
export type DayHours = z.infer<typeof dayHoursSchema>;
export type Product = z.infer<typeof productSchema>;

/** A fully-null storefront — the partial fallback when structuring fails. */
export function emptyStorefront(): Storefront {
  return {
    name: null,
    tagline: null,
    about: null,
    category: null,
    phone: null,
    whatsapp: null,
    address: null,
    hours: null,
    products: [],
    language: null,
  };
}

/** "21:00" -> "9:00 PM". Returns the raw value if it isn't HH:MM. */
export function formatTime(hhmm: string | null | undefined): string {
  if (!hhmm) return "";
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return hhmm;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

const JS_DAY_TO_KEY: DayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export type OpenState =
  | { status: "open"; closesAt: string }
  | { status: "closed"; opensAt: string | null }
  | { status: "unknown" };

/**
 * Compute the open/closed-now state from the hours object using the provided
 * time (defaults to now, in the viewer's local timezone — fine for the M0
 * preview). Does not handle overnight spans that cross midnight.
 */
export function getOpenState(
  hours: Storefront["hours"],
  now: Date = new Date(),
): OpenState {
  if (!hours) return { status: "unknown" };

  const todayKey = JS_DAY_TO_KEY[now.getDay()];
  const today = hours[todayKey];
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const toMinutes = (hhmm: string | null): number | null => {
    if (!hhmm) return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };

  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (open !== null && close !== null && minutesNow >= open && minutesNow < close) {
      return { status: "open", closesAt: formatTime(today.close) };
    }
    if (open !== null && minutesNow < open) {
      return { status: "closed", opensAt: formatTime(today.open) };
    }
  }

  // Closed now — find the next day that has an opening time.
  for (let i = 1; i <= 7; i++) {
    const key = JS_DAY_TO_KEY[(now.getDay() + i) % 7];
    const day = hours[key];
    if (day?.open) {
      return { status: "closed", opensAt: formatTime(day.open) };
    }
  }

  return { status: "closed", opensAt: null };
}

/**
 * Collapse the per-day hours into a few human-readable lines, grouping
 * consecutive days that share the same open/close window.
 * e.g. "Mon–Sat · 9:00 AM – 9:00 PM", "Sun · Closed".
 */
export function summarizeHours(hours: Storefront["hours"]): string[] {
  if (!hours) return [];

  const sig = (d: DayHours): string =>
    d && d.open && d.close ? `${d.open}-${d.close}` : "closed";

  const lines: string[] = [];
  let runStart = 0;

  for (let i = 1; i <= DAY_KEYS.length; i++) {
    const prevKey = DAY_KEYS[i - 1];
    const curKey = DAY_KEYS[i];
    const sameAsPrev = curKey && sig(hours[curKey]) === sig(hours[prevKey]);
    if (sameAsPrev) continue;

    const startKey = DAY_KEYS[runStart];
    const endKey = DAY_KEYS[i - 1];
    const label =
      runStart === i - 1
        ? DAY_LABELS[startKey]
        : `${DAY_LABELS[startKey]}–${DAY_LABELS[endKey]}`;

    const day = hours[startKey];
    const window =
      day && day.open && day.close
        ? `${formatTime(day.open)} – ${formatTime(day.close)}`
        : "Closed";

    lines.push(`${label} · ${window}`);
    runStart = i;
  }

  return lines;
}
