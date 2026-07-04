import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { getSubscriptionForOwner, isPro } from "@/lib/subscriptions";
import { PRO_PRICE_INR } from "@/lib/plans";
import { razorpayConfigured } from "@/lib/razorpay";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import { AccountNav } from "@/components/AccountNav";
import { UpgradeButton } from "@/components/UpgradeButton";
import styles from "./billing.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Plan & billing · BolDukaan" };

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/dashboard");

  const tr = t((await viewerLang()) ?? "hi");

  const sub = isDbConfigured()
    ? await getSubscriptionForOwner(session.user.id).catch(() => null)
    : null;
  const pro = isPro(sub);
  const billingReady = razorpayConfigured();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.back}>
            {tr.billBack}
          </Link>
          <AccountNav />
        </div>
        <h1 className={styles.title}>{tr.billTitle}</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          <section
            className={`${styles.planCard} ${!pro ? styles.currentCard : ""}`}
          >
            <div className={styles.planTop}>
              <span className={styles.planName}>{tr.billFreeName}</span>
              {!pro && (
                <span className={styles.currentBadge}>
                  {tr.billCurrentBadge}
                </span>
              )}
            </div>
            <div className={styles.price}>
              {tr.billFreePrice}
              <span className={styles.per}>{tr.billPerMonth}</span>
            </div>
            <p className={styles.planDesc}>{tr.billFreeDesc}</p>
            <ul className={styles.features}>
              {tr.billFeaturesFree.map((f) => (
                <li key={f} className={styles.feature}>
                  <span className={styles.tick} aria-hidden>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            {!pro && (
              <p className={styles.currentNote}>{tr.billCurrentCta}</p>
            )}
          </section>

          <section
            className={`${styles.planCard} ${pro ? styles.currentCard : ""}`}
          >
            <div className={styles.planTop}>
              <span className={styles.planName}>{tr.billProName}</span>
              {pro && (
                <span className={styles.currentBadge}>
                  {tr.billCurrentBadge}
                </span>
              )}
            </div>
            <div className={styles.price}>
              ₹{PRO_PRICE_INR}
              <span className={styles.per}>{tr.billPerMonth}</span>
            </div>
            <p className={styles.planDesc}>{tr.billProDesc}</p>
            <ul className={styles.features}>
              {tr.billFeaturesPro.map((f) => (
                <li key={f} className={styles.feature}>
                  <span className={styles.tick} aria-hidden>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            {pro ? (
              <p className={styles.currentNote}>{tr.billCurrentCta}</p>
            ) : billingReady ? (
              <UpgradeButton
                label={tr.billUpgradeCta}
                busyLabel={tr.billStarting}
              />
            ) : (
              <p className={styles.note}>
                Billing isn&apos;t configured yet — set the RAZORPAY_* env vars
                to enable checkout.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
