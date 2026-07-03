"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ShopSummary } from "@/lib/shops";
import { THEMES, FREE_THEMES, type Plan } from "@/lib/plans";
import { t, type UiLang } from "@/lib/i18n";
import { QrCode } from "./QrCode";
import styles from "@/app/dashboard/dashboard.module.css";

export function DashboardShops({
  shops,
  plan = "free",
  lang = "hi",
}: {
  shops: ShopSummary[];
  plan?: Plan;
  lang?: UiLang;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [qrFor, setQrFor] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const tr = t(lang);

  useEffect(() => setOrigin(window.location.origin), []);

  async function toggleStatus(slug: string, status: string) {
    setBusy(slug);
    const next = status === "active" ? "unpublished" : "active";
    await fetch(`/api/shops/${slug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(null);
    router.refresh();
  }

  async function changeTheme(slug: string, theme: string) {
    setBusy(slug);
    setNotice(null);
    const res = await fetch(`/api/shops/${slug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme }),
    });
    setBusy(null);
    if (res.status === 402) {
      setNotice(tr.proThemeNotice);
      return;
    }
    router.refresh();
  }

  async function remove(slug: string) {
    if (!confirm(tr.confirmDelete)) return;
    setBusy(slug);
    await fetch(`/api/shops/${slug}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <>
      {notice && <p className={styles.notice}>{notice}</p>}
      <ul className={styles.list}>
        {shops.map((shop) => (
          <li key={shop.slug} className={styles.card}>
            <div className={styles.cardMain}>
              <div className={styles.cardName}>
                {shop.name ?? tr.yourShop}
              </div>
              <div className={styles.cardMeta}>
                <span
                  className={
                    shop.status === "active"
                      ? styles.badgeLive
                      : styles.badgeDraft
                  }
                >
                  {shop.status === "active" ? tr.badgeLive : tr.badgeUnpublished}
                </span>
                <span className={styles.slug}>/s/{shop.slug}</span>
                <span className={styles.slug}>{tr.viewsLabel(shop.views)}</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              {shop.status === "active" && (
                <Link
                  href={`/s/${shop.slug}`}
                  target="_blank"
                  className={styles.action}
                >
                  {tr.actView}
                </Link>
              )}
              <Link
                href={`/dashboard/${shop.slug}/edit`}
                className={styles.action}
              >
                {tr.actEdit}
              </Link>
              <select
                className={styles.themeSelect}
                value={shop.theme}
                disabled={busy === shop.slug}
                onChange={(e) => changeTheme(shop.slug, e.target.value)}
                aria-label="Theme"
              >
                {THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                    {plan !== "pro" && !FREE_THEMES.includes(theme.id)
                      ? " · Pro"
                      : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.action}
                onClick={() => setQrFor(qrFor === shop.slug ? null : shop.slug)}
              >
                QR
              </button>
              <button
                type="button"
                className={styles.action}
                onClick={() => toggleStatus(shop.slug, shop.status)}
                disabled={busy === shop.slug}
              >
                {shop.status === "active" ? tr.actUnpublish : tr.actPublish}
              </button>
              <button
                type="button"
                className={styles.actionDanger}
                onClick={() => remove(shop.slug)}
                disabled={busy === shop.slug}
              >
                {tr.actDelete}
              </button>
            </div>

            {qrFor === shop.slug && origin && (
              <div className={styles.qrPanel}>
                <QrCode
                  url={`${origin}/s/${shop.slug}`}
                  downloadName={shop.slug}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
