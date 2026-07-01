import { randomBytes } from "node:crypto";

/**
 * Turn a shop name into a URL-safe base: lowercase, spaces→hyphens, strip
 * anything that isn't a–z/0–9/hyphen. Non-Latin scripts (Hindi/Punjabi) get
 * transliterated away by the strip, so we fall back to "shop" when nothing
 * usable remains — the random suffix still makes the slug unique.
 */
export function slugifyName(name: string | null): string {
  const base = (name ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "shop";
}

/** Short, URL-safe random suffix so slugs are unique without collision retries. */
export function shortId(bytes = 4): string {
  return randomBytes(bytes).toString("hex"); // 8 hex chars for 4 bytes
}

/** A longer, unguessable token that acts as login-less proof of ownership (M1). */
export function editToken(): string {
  return randomBytes(24).toString("base64url");
}

export function makeSlug(name: string | null): string {
  return `${slugifyName(name)}-${shortId()}`;
}
