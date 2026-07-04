"use client";

import { useCallback, useState } from "react";
import { getOpenState, type Storefront } from "@/lib/storefront";
import { t, type UiLang } from "@/lib/i18n";
import { SHOP_CATEGORIES, matchesCategory } from "@/lib/categories";
import { mapsDirectionsUrl } from "@/lib/seo";
import styles from "@/app/nearby/nearby.module.css";

interface NearbyShop {
  slug: string;
  name: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  language: string | null;
  hours: Storefront["hours"];
  products: string[];
  distanceKm: number;
}

type State = "idle" | "locating" | "loading" | "done" | "denied" | "error";

function telHref(num: string): string {
  return `tel:${num.replace(/[^\d+]/g, "")}`;
}

export function NearbyBrowser({ lang }: { lang: UiLang }) {
  const tr = t(lang);
  const [state, setState] = useState<State>("idle");
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const find = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState("denied");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState("loading");
        try {
          const res = await fetch(
            `/api/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=5`,
          );
          const data = (await res.json()) as { shops?: NearbyShop[] };
          setShops(Array.isArray(data.shops) ? data.shops : []);
          setState("done");
        } catch {
          setState("error");
        }
      },
      // Permission denied or unavailable — the visitor's location is never sent
      // anywhere except this one nearby query, and never stored.
      () => setState("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const showCta = state === "idle" || state === "denied" || state === "error";

  // "Show me what I need" — free-text search plus category chips, both matched
  // against the shop's name / category / address / products text.
  const q = query.trim().toLowerCase();
  const activeCategory = SHOP_CATEGORIES.find((c) => c.id === category) ?? null;
  const filtered = shops.filter((s) => {
    const haystack = [s.name, s.category, s.address, ...s.products]
      .filter(Boolean)
      .join(" ");
    if (activeCategory && !matchesCategory(activeCategory, haystack)) {
      return false;
    }
    return q === "" || haystack.toLowerCase().includes(q);
  });

  return (
    <div>
      {showCta && (
        <button type="button" className={styles.cta} onClick={find}>
          {tr.nearbyUseLocation}
        </button>
      )}
      {state === "denied" && <p className={styles.status}>{tr.nearbyDenied}</p>}
      {state === "error" && <p className={styles.status}>{tr.errNetwork}</p>}
      {(state === "locating" || state === "loading") && (
        <p className={styles.status}>{tr.nearbyLoading}</p>
      )}
      {state === "done" && shops.length === 0 && (
        <p className={styles.status}>{tr.nearbyEmpty}</p>
      )}

      {state === "done" && shops.length > 0 && (
        <>
          <input
            className={styles.search}
            type="search"
            placeholder={tr.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles.catRow} role="group" aria-label="Category">
            <button
              type="button"
              className={category === null ? styles.catChipActive : styles.catChip}
              aria-pressed={category === null}
              onClick={() => setCategory(null)}
            >
              {tr.catAll}
            </button>
            {SHOP_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={
                  category === c.id ? styles.catChipActive : styles.catChip
                }
                aria-pressed={category === c.id}
                onClick={() => setCategory(category === c.id ? null : c.id)}
              >
                {c.labels[lang]}
              </button>
            ))}
          </div>
        </>
      )}

      {state === "done" && shops.length > 0 && filtered.length === 0 && (
        <p className={styles.status}>{tr.nearbyEmpty}</p>
      )}

      {state === "done" && filtered.length > 0 && (
        <ul className={styles.list}>
          {filtered.map((shop) => {
            const open = getOpenState(shop.hours);
            return (
              <li key={shop.slug} className={styles.card}>
                <a className={styles.cardLink} href={`/s/${shop.slug}`}>
                  <div className={styles.cardTop}>
                    <span className={styles.name}>{shop.name ?? "Shop"}</span>
                    <span className={styles.dist}>
                      {tr.kmAway(shop.distanceKm.toFixed(1))}
                    </span>
                  </div>
                  <div className={styles.metaRow}>
                    {shop.category && (
                      <span className={styles.cat}>{shop.category}</span>
                    )}
                    {open.status === "open" && (
                      <span className={styles.open}>🟢 {tr.openNow}</span>
                    )}
                    {open.status === "closed" && (
                      <span className={styles.closed}>{tr.closedNow}</span>
                    )}
                  </div>
                  {shop.address && (
                    <div className={styles.addr}>📍 {shop.address}</div>
                  )}
                </a>
                {(shop.phone || shop.address) && (
                  <div className={styles.cardActions}>
                    {shop.phone && (
                      <a className={styles.actionBtn} href={telHref(shop.phone)}>
                        {tr.actCall}
                      </a>
                    )}
                    {shop.address && (
                      <a
                        className={styles.actionBtnAlt}
                        href={mapsDirectionsUrl(shop.name, shop.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tr.actDirections}
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
