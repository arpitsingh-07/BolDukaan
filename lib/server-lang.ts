import { cookies } from "next/headers";
import { LANG_COOKIE, type UiLang } from "./i18n";

/**
 * The viewer's chosen app language, read from the cookie the client sets.
 * Server-only (next/headers) — that's why this isn't in i18n.ts, which is
 * shared with client components.
 *
 * Returns null when the viewer has never chosen — callers pick the fallback:
 * public pages fall back to the SHOP's language, app chrome falls back to "hi".
 */
export async function viewerLang(): Promise<UiLang | null> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return value === "hi" || value === "pa" || value === "en" ? value : null;
}
