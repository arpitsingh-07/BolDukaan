import {
  getOpenState,
  summarizeHours,
  type Storefront,
} from "@/lib/storefront";
import { normalizeLang, t, type UiLang } from "@/lib/i18n";
import { mapsDirectionsUrl } from "@/lib/seo";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { CheckIcon, PhoneIcon } from "./icons";
import styles from "./storefront-card.module.css";

function telHref(num: string): string {
  return `tel:${num.replace(/[^\d+]/g, "")}`;
}

function waHref(num: string, text?: string): string {
  // wa.me requires the international format. Owners speak local 10-digit
  // numbers (often with a leading 0), so normalise to 91XXXXXXXXXX.
  let digits = num.replace(/[^\d]/g, "").replace(/^0+/, "");
  if (digits.length === 10) digits = `91${digits}`;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function StorefrontCard({
  storefront,
  theme = "classic",
  lang,
  forceClosed = false,
}: {
  storefront: Storefront;
  theme?: string;
  /** Viewer's language override; falls back to the shop's own language. */
  lang?: UiLang;
  /** Owner's "stepped out" override — closed regardless of scheduled hours. */
  forceClosed?: boolean;
}) {
  // Labels follow the VIEWER's chosen language when known, otherwise the
  // shop's language (first-time visitors clicking a shared link). Content
  // (name, tagline, products) is always whatever the owner spoke.
  const tr = t(lang ?? normalizeLang(storefront.language));

  const open = getOpenState(storefront.hours);
  const hoursLines = summarizeHours(storefront.hours, {
    dayLabels: tr.dayLabels,
    closedWord: tr.closedWord,
  });
  // Most owners give one number for both calling and WhatsApp — fall back to
  // phone so per-item and shop-level WhatsApp actions are always available.
  const waNumber = storefront.whatsapp ?? storefront.phone;
  const hasContent =
    storefront.name ||
    storefront.products.length > 0 ||
    storefront.address ||
    storefront.phone ||
    storefront.whatsapp ||
    hoursLines.length > 0;

  return (
    <div className={styles.card} data-theme={theme}>
      {storefront.images.length > 0 && (
        <div className={styles.gallery}>
          {storefront.images.slice(0, 4).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={storefront.name ?? "Shop photo"}
              className={styles.galleryImg}
              loading="lazy"
            />
          ))}
        </div>
      )}

      {storefront.category && (
        <div className={styles.eyebrow}>{storefront.category}</div>
      )}

      <h2 className={styles.shopname}>{storefront.name ?? tr.yourShop}</h2>

      {storefront.tagline && (
        <p className={styles.tagline}>{storefront.tagline}</p>
      )}

      {forceClosed ? (
        <span className={styles.closed}>
          <span className={styles.rdot} />
          {tr.closedTemporarily}
        </span>
      ) : (
        <>
          {open.status === "open" && (
            <span className={styles.open}>
              <span className={styles.gdot} />
              {tr.openNow} · {tr.closes(open.closesAt)}
            </span>
          )}
          {open.status === "closed" && (
            <span className={styles.closed}>
              <span className={styles.rdot} />
              {open.opensAt
                ? `${tr.closedNow} · ${tr.opens(open.opensAt)}`
                : tr.closedNow}
            </span>
          )}
        </>
      )}

      <div className={styles.trustRow}>
        <span className={styles.trustBadge}>
          <CheckIcon size={12} /> {tr.badgeLocalBiz}
        </span>
        {storefront.phone && (
          <span className={styles.trustBadge}>
            <CheckIcon size={12} /> {tr.badgePhoneAvail}
          </span>
        )}
        {(storefront.whatsapp || storefront.phone) && (
          <span className={styles.trustBadge}>
            <CheckIcon size={12} /> {tr.badgeOnWhatsApp}
          </span>
        )}
      </div>

      {hoursLines.length > 0 && (
        <div className={styles.meta}>
          <span className={styles.label}>{tr.hours}</span>
          {hoursLines.map((line) => (
            <span key={line} className={styles.hoursLine}>
              {line}
            </span>
          ))}
        </div>
      )}

      {storefront.address && (
        <div className={styles.meta}>
          <span className={styles.label}>{tr.address}</span>
          <span>{storefront.address}</span>
          <a
            className={styles.mapLink}
            href={mapsDirectionsUrl(storefront.name, storefront.address)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {tr.getDirections} →
          </a>
        </div>
      )}

      {storefront.products.length > 0 && (
        <div className={styles.meta}>
          <span className={styles.label}>{tr.sells}</span>
          {/* Catalogue grid: each item can be asked about on WhatsApp. A future
              Pro plan will cap the free item count here — for now everyone gets
              the full grid (see catalogue gating note). */}
          <div className={styles.catalogue}>
            {storefront.products.map((product, i) => {
              const label = product.price
                ? `${product.name} (${product.price})`
                : product.name;
              return (
                <div key={`${product.name}-${i}`} className={styles.item}>
                  <span className={styles.itemName}>{product.name}</span>
                  {product.price && (
                    <span className={styles.itemPrice}>{product.price}</span>
                  )}
                  {product.note && (
                    <span className={styles.itemNote}>{product.note}</span>
                  )}
                  {waNumber && (
                    <a
                      className={styles.itemAsk}
                      href={waHref(waNumber, tr.itemAskText(label))}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon size={13} />
                      {tr.askOnWhatsApp}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {storefront.about && <p className={styles.about}>{storefront.about}</p>}

      {(storefront.phone || storefront.whatsapp) && (
        <div className={styles.actions}>
          {storefront.phone && (
            <a
              className={`${styles.btn} ${styles.call}`}
              href={telHref(storefront.phone)}
            >
              <PhoneIcon size={15} /> {tr.callShop}
            </a>
          )}
          {waNumber && (
            <a
              className={`${styles.btn} ${styles.wa}`}
              href={waHref(waNumber)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
          )}
        </div>
      )}

      {!hasContent && <p className={styles.empty}>{tr.emptyCard}</p>}
    </div>
  );
}
