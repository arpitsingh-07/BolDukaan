import Link from "next/link";
import type { Metadata } from "next";
import { auth, signIn } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { listShopsByOwner, type ShopSummary } from "@/lib/shops";
import { planForOwner } from "@/lib/subscriptions";
import type { Plan } from "@/lib/plans";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import { AccountNav, authConfigured } from "@/components/AccountNav";
import { DashboardShops } from "@/components/DashboardShops";
import { BrandMark } from "@/components/BrandMark";
import { BrandName } from "@/components/BrandName";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard · BolDukaan" };

export default async function DashboardPage() {
  const session = await auth();
  const lang = (await viewerLang()) ?? "hi";
  const tr = t(lang);

  if (!session?.user) {
    return (
      <main className={styles.gate}>
        <div className={styles.gateInner}>
          <p className={styles.brand}>
            <BrandMark size={34} />
            <BrandName tone="dark" />
          </p>
          <h1 className={styles.gateTitle}>{tr.gateTitle}</h1>
          <p className={styles.gateSub}>{tr.gateSub}</p>
          {authConfigured() ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button type="submit" className={styles.gateBtn}>
                {tr.gateSignInGoogle}
              </button>
            </form>
          ) : (
            <p className={styles.gateSub}>
              Sign-in isn&apos;t configured yet — add AUTH_GOOGLE_ID and
              AUTH_GOOGLE_SECRET to .env.local (see .env.example).
            </p>
          )}
          <Link href="/" className={styles.gateLink}>
            {tr.gateBack}
          </Link>
        </div>
      </main>
    );
  }

  let shops: ShopSummary[] = [];
  let plan: Plan = "free";
  let dbError = false;
  if (!isDbConfigured()) {
    dbError = true;
  } else {
    try {
      [shops, plan] = await Promise.all([
        listShopsByOwner(session.user.id),
        planForOwner(session.user.id),
      ]);
    } catch {
      dbError = true;
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p className={styles.brand}>
            <BrandMark size={26} />
            <BrandName tone="dark" />
          </p>
          <AccountNav />
        </div>
        <h1 className={styles.title}>{tr.dashWelcome}</h1>
        <p className={styles.subtitle}>
          {tr.dashSignedInAs} {session.user.email ?? session.user.name ?? "—"} ·{" "}
          <Link href="/dashboard/billing" className={styles.planLink}>
            {tr.dashManagePlan}
          </Link>
        </p>
        <div className={styles.headerActions}>
          <Link href="/create" className={styles.createBtn}>
            {tr.dashCreateNew}
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <h2 className={styles.sectionTitle}>{tr.dashTitle}</h2>
        {dbError ? (
          <p className={styles.notice}>
            Database isn&apos;t configured. Set DATABASE_URL and run{" "}
            <code>npm run db:init</code>.
          </p>
        ) : shops.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>{tr.dashEmpty}</p>
            <Link href="/create" className={styles.emptyCta}>
              {tr.dashEmptyCta}
            </Link>
          </div>
        ) : (
          <DashboardShops shops={shops} plan={plan} lang={lang} />
        )}
      </main>
    </div>
  );
}
