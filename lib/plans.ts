/** Plan definitions and feature limits (M3). */

export type Plan = "free" | "pro";

export const FREE_STOREFRONT_LIMIT = 1;
export const PRO_STOREFRONT_LIMIT = 5;

/** Target price — validate with real owners before committing (PRD §10). */
export const PRO_PRICE_INR = 249;
/** Same price in paise — Razorpay works in the smallest currency unit. */
export const PRO_PRICE_PAISE = PRO_PRICE_INR * 100;

export const THEMES = [
  { id: "classic", name: "Classic" },
  { id: "petrol", name: "Petrol" },
  { id: "warm", name: "Warm" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

/** Themes available on the free plan (all themes are Pro). */
export const FREE_THEMES: string[] = ["classic"];

// Plan feature copy lives in lib/i18n.ts (billFeaturesFree / billFeaturesPro)
// so it's translated like all other UI text.
