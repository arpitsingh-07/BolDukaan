"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/app/dashboard/billing/billing.module.css";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(s);
  });
}

export function UpgradeButton({
  label = "Upgrade to Pro",
  busyLabel = "Starting checkout…",
}: {
  label?: string;
  busyLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/subscribe", { method: "POST" });
      const data = (await res.json()) as {
        subscriptionId?: string;
        keyId?: string;
        error?: string;
      };
      if (!res.ok || !data.subscriptionId) {
        setError(data.error ?? "Couldn't start checkout.");
        setBusy(false);
        return;
      }

      await loadCheckout();
      if (!window.Razorpay) {
        setError("Checkout is unavailable right now.");
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "BolDukaan",
        description: "Pro plan",
        theme: { color: "#0C3B38" },
        // Payment confirmation is authoritative via the webhook; we just refresh.
        handler: () => router.refresh(),
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch {
      setError("Something went wrong starting checkout.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={styles.upgradeBtn}
        onClick={upgrade}
        disabled={busy}
      >
        {busy ? busyLabel : label}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
