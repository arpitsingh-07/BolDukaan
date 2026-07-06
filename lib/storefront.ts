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

/**
 * Every field is nullable AND defaulted: a well-behaved model sends explicit
 * nulls, but if a key is omitted entirely (models do this occasionally), the
 * default fills it instead of failing the whole parse into the fallback path.
 * z.infer output types are unchanged by .default().
 */
const dayHoursSchema = z
  .object({
    // 24-hour "HH:MM"
    open: z.string().nullable().default(null),
    close: z.string().nullable().default(null),
  })
  .nullable()
  .default(null);

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
  .nullable()
  .default(null);

const productSchema = z.object({
  name: z.string(),
  price: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
});

export const storefrontSchema = z.object({
  name: z.string().nullable().default(null),
  tagline: z.string().nullable().default(null),
  about: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  whatsapp: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  hours: hoursSchema,
  products: z.array(productSchema).default([]),
  /** Owner-uploaded photos (compressed data URLs, or later blob URLs). */
  images: z.array(z.string()).default([]),
  /** ISO-639 hint for the dominant input language: "hi" | "pa" | "en". */
  language: z.string().nullable().default(null),
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
    images: [],
    language: null,
  };
}

/**
 * True if `raw` is (or normalises to) a 10-digit phone number. Owners speak
 * numbers loosely — "+91", a leading 0, spaces, dashes — so we strip to digits
 * and drop a 91 country code or leading 0, then require exactly 10 digits.
 * No restriction on the starting digit.
 */
export function isValidPhone(raw: string | null | undefined): boolean {
  if (!raw) return false;
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.length === 10;
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
 * BolDukaan shops are Indian shops, so "open now" is always evaluated in IST —
 * regardless of the server's timezone (Vercel runs UTC) or the viewer's.
 * Intl.DateTimeFormat does the timezone math; no date library needed.
 */
function istDayAndMinutes(date: Date): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  let weekday = "Mon";
  let hour = 0;
  let minute = 0;
  for (const part of parts) {
    if (part.type === "weekday") weekday = part.value;
    else if (part.type === "hour") hour = Number(part.value);
    else if (part.type === "minute") minute = Number(part.value);
  }
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday,
  );
  return { dayIndex: dayIndex === -1 ? 1 : dayIndex, minutes: hour * 60 + minute };
}

/**
 * Compute the open/closed-now state from the hours object, evaluated in IST.
 * Does not handle overnight spans that cross midnight.
 */
export function getOpenState(
  hours: Storefront["hours"],
  now: Date = new Date(),
): OpenState {
  if (!hours) return { status: "unknown" };

  const { dayIndex, minutes: minutesNow } = istDayAndMinutes(now);
  const todayKey = JS_DAY_TO_KEY[dayIndex];
  const today = hours[todayKey];

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
    const key = JS_DAY_TO_KEY[(dayIndex + i) % 7];
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
 * Labels default to English; pass localized ones for Hindi/Punjabi shops.
 */
export function summarizeHours(
  hours: Storefront["hours"],
  opts?: { dayLabels?: Record<DayKey, string>; closedWord?: string },
): string[] {
  if (!hours) return [];

  const dayLabels = opts?.dayLabels ?? DAY_LABELS;
  const closedWord = opts?.closedWord ?? "Closed";

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
        ? dayLabels[startKey]
        : `${dayLabels[startKey]}–${dayLabels[endKey]}`;

    const day = hours[startKey];
    const window =
      day && day.open && day.close
        ? `${formatTime(day.open)} – ${formatTime(day.close)}`
        : closedWord;

    lines.push(`${label} · ${window}`);
    runStart = i;
  }

  return lines;
}
