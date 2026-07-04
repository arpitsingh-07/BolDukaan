import type { Storefront, DayKey } from "./storefront";

/** Google Maps "directions" deep link — no API key needed, resolves the address. */
export function mapsDirectionsUrl(name: string | null, address: string): string {
  const destination = [name, address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

const DAY_TO_SCHEMA: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/**
 * schema.org LocalBusiness JSON-LD. Lets Google Search/Maps understand the page
 * as a real business (name, address, phone, hours) — the free path to better
 * findability without a Google Business Profile.
 */
export function localBusinessJsonLd(
  sf: Storefront,
  url: string,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: sf.name ?? "Shop",
    url,
  };
  if (sf.phone) data.telephone = sf.phone;
  if (sf.address) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: sf.address,
      addressCountry: "IN",
    };
  }
  if (sf.hours) {
    const spec: Record<string, string>[] = [];
    for (const day of Object.keys(DAY_TO_SCHEMA) as DayKey[]) {
      const h = sf.hours[day];
      if (h && h.open && h.close) {
        spec.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${DAY_TO_SCHEMA[day]}`,
          opens: h.open,
          closes: h.close,
        });
      }
    }
    if (spec.length > 0) data.openingHoursSpecification = spec as never;
  }
  return data;
}

/**
 * Serialise JSON-LD safely for an inline <script>. JSON.stringify escapes
 * quotes, but a shop name containing "</script>" could still break out — so
 * also escape "<". Prevents stored-XSS via model/owner-supplied text.
 */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
