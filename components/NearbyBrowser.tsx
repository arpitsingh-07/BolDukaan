"use client";

import { useCallback, useState } from "react";
import { getOpenState, type Storefront } from "@/lib/storefront";
import { t, type UiLang } from "@/lib/i18n";
import styles from "@/app/nearby/nearby.module.css";

interface NearbyShop {
  slug: string;
  name: string | null;
  category: string | null;
  address: string | null;
  language: string | null;
  hours: Storefront["hours"];
  products: string[];
  distanceKm: number;
}

type State = "idle" | "locating" | "loading" | "done" | "denied" | "error";

export function NearbyBrowser({ lang }: { lang: UiLang }) {
  const tr = t(lang);
  const [state, setState] = useState<State>("idle");
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [query, setQuery] = useState("");

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

  // "Show me what I need" — filter the nearby results by name / category / product.
  const q = query.trim().toLowerCase();
  const filtered =
    q === ""
      ? shops
      : shops.filter((s) =>
          [s.name, s.category, s.address, ...s.products]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q),
        );

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
        <input
          className={styles.search}
          type="search"
          placeholder={tr.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {state === "done" && shops.length > 0 && filtered.length === 0 && (
        <p className={styles.status}>{tr.nearbyEmpty}</p>
      )}

      {state === "done" && filtered.length > 0 && (
        <ul className={styles.list}>
          {filtered.map((shop) => {
            const open = getOpenState(shop.hours);
            return (
              <li key={shop.slug}>
                <a className={styles.card} href={`/s/${shop.slug}`}>
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
                      <span className={styles.open}>{tr.openNow}</span>
                    )}
                    {open.status === "closed" && (
                      <span className={styles.closed}>{tr.closedNow}</span>
                    )}
                  </div>
                  {shop.address && (
                    <div className={styles.addr}>{shop.address}</div>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
