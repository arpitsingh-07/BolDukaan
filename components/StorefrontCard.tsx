import {
  getOpenState,
  summarizeHours,
  type Storefront,
} from "@/lib/storefront";
import styles from "./storefront-card.module.css";

/** Map the detected input language to the right font class (avoids tofu). */
function langClass(language: string | null): string {
  if (language === "hi") return "deva";
  if (language === "pa") return "gurmukhi";
  return "";
}

function telHref(num: string): string {
  return `tel:${num.replace(/[^\d+]/g, "")}`;
}

function waHref(num: string): string {
  const digits = num.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

export function StorefrontCard({ storefront }: { storefront: Storefront }) {
  const lang = langClass(storefront.language);
  const open = getOpenState(storefront.hours);
  const hoursLines = summarizeHours(storefront.hours);
  const hasContent =
    storefront.name ||
    storefront.products.length > 0 ||
    storefront.address ||
    storefront.phone ||
    storefront.whatsapp ||
    hoursLines.length > 0;

  return (
    <div className={styles.card}>
      {storefront.category && (
        <div className={styles.eyebrow}>{storefront.category}</div>
      )}

      <h2 className={`${styles.shopname} ${lang}`.trim()}>
        {storefront.name ?? "Your shop"}
      </h2>

      {storefront.tagline && (
        <p className={`${styles.tagline} ${lang}`.trim()}>
          {storefront.tagline}
        </p>
      )}

      {open.status === "open" && (
        <span className={styles.open}>
          <span className={styles.gdot} />
          Open now · closes {open.closesAt}
        </span>
      )}
      {open.status === "closed" && (
        <span className={styles.closed}>
          <span className={styles.rdot} />
          {open.opensAt ? `Closed · opens ${open.opensAt}` : "Closed"}
        </span>
      )}

      {hoursLines.length > 0 && (
        <div className={styles.meta}>
          <span className={styles.label}>Hours</span>
          {hoursLines.map((line) => (
            <span key={line} className={styles.hoursLine}>
              {line}
            </span>
          ))}
        </div>
      )}

      {storefront.address && (
        <div className={styles.meta}>
          <span className={styles.label}>Address</span>
          <span className={lang}>{storefront.address}</span>
        </div>
      )}

      {storefront.products.length > 0 && (
        <div className={styles.meta}>
          <span className={styles.label}>Sells</span>
          <div className={styles.chips}>
            {storefront.products.map((product, i) => (
              <span key={`${product.name}-${i}`} className={`${styles.chip} ${lang}`.trim()}>
                {product.name}
                {product.price && (
                  <span className={styles.chipPrice}> · {product.price}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {storefront.about && (
        <p className={`${styles.about} ${lang}`.trim()}>{storefront.about}</p>
      )}

      {(storefront.phone || storefront.whatsapp) && (
        <div className={styles.actions}>
          {storefront.phone && (
            <a className={`${styles.btn} ${styles.call}`} href={telHref(storefront.phone)}>
              Call shop
            </a>
          )}
          {storefront.whatsapp && (
            <a
              className={`${styles.btn} ${styles.wa}`}
              href={waHref(storefront.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          )}
        </div>
      )}

      {!hasContent && (
        <p className={styles.empty}>
          We couldn&apos;t pick out shop details yet. Try again and describe your
          shop&apos;s name, what you sell, your hours, and a phone number.
        </p>
      )}
    </div>
  );
}
