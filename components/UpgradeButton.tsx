"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/app/dashboard/billing/billing.module.css";

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (resp: unknown) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => RazorpayInstance;
  }
}

interface CheckoutSuccess {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
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
      // 1) Create the subscription on the server.
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

      // 2) Open Standard Checkout.
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
        description: "Pro plan · ₹149/month",
        theme: { color: "#0C3B38" },
        // 3) On success, verify the signature server-side before trusting it.
        handler: async (resp: unknown) => {
          const r = resp as CheckoutSuccess;
          try {
            const v = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(r),
            });
            if (v.ok) {
              router.refresh(); // Pro is now active in the DB
            } else {
              const e = (await v.json()) as { error?: string };
              setError(e.error ?? "Payment couldn't be verified.");
            }
          } catch {
            setError("Payment verification failed. If you were charged, contact support.");
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });

      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setBusy(false);
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
