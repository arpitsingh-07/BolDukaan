"use client";

import { useState } from "react";
import { t, type UiLang } from "@/lib/i18n";
import styles from "./report-shop.module.css";

/** Low-key "report this shop" control on the public storefront page. */
export function ReportShop({ slug, lang }: { slug: string; lang: UiLang }) {
  const tr = t(lang);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const r = reason.trim();
    if (r.length < 3) return;
    setBusy(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, reason: r }),
      });
      setDone(true);
    } catch {
      setDone(true); // best-effort; don't trap the visitor on a failed send
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className={styles.thanks}>{tr.reportThanks}</p>;
  }

  if (!open) {
    return (
      <button type="button" className={styles.link} onClick={() => setOpen(true)}>
        {tr.reportShop}
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <p className={styles.prompt}>{tr.reportPrompt}</p>
      <textarea
        className={styles.textarea}
        placeholder={tr.reportPlaceholder}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
      />
      <button
        type="button"
        className={styles.submit}
        onClick={submit}
        disabled={busy || reason.trim().length < 3}
      >
        {tr.reportSubmit}
      </button>
    </div>
  );
}
