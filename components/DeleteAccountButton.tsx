"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { t, type UiLang } from "@/lib/i18n";
import styles from "./delete-account.module.css";

/** Danger-zone control on the dashboard: delete the whole account + shops. */
export function DeleteAccountButton({ lang }: { lang: UiLang }) {
  const tr = t(lang);
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(tr.confirmDeleteAccount)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        await signOut({ redirectTo: "/" });
      } else {
        setBusy(false);
        alert(tr.authGeneric);
      }
    } catch {
      setBusy(false);
      alert(tr.authGeneric);
    }
  }

  return (
    <div className={styles.zone}>
      <button
        type="button"
        className={styles.btn}
        onClick={onDelete}
        disabled={busy}
      >
        {tr.dashDeleteAccount}
      </button>
    </div>
  );
}
