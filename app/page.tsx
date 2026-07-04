import Link from "next/link";
import type { ReactNode } from "react";
import { auth, signIn } from "@/auth";
import { authConfigured } from "@/components/AccountNav";
import { LangSwitcher } from "@/components/LangSwitcher";
import { LandingDemo } from "@/components/LandingDemo";
import { BrandMark } from "@/components/BrandMark";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

/** "Register your shop" — a plain link when a target exists, else Google sign-in. */
function RegisterCta({
  target,
  action,
  className,
  children,
}: {
  target: string | null;
  action: () => Promise<void>;
  className: string;
  children: ReactNode;
}) {
  return target ? (
    <Link href={target} className={className}>
      {children}
    </Link>
  ) : (
    <form action={action} className={styles.ctaForm}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

/**
 * Public landing page — the entry point for both audiences: customers go to
 * nearby discovery, owners go through sign-in into the dashboard, and from
 * there into the voice builder (/create).
 */
export default async function LandingPage() {
  const session = await auth();
  const lang = (await viewerLang()) ?? "hi";
  const tr = t(lang);

  // Where "Register your shop" leads: signed-in owners go straight to their
  // dashboard; without OAuth configured (local dev) fall through to the
  // builder; otherwise start Google sign-in.
  const registerTarget = session?.user
    ? "/dashboard"
    : !authConfigured()
      ? "/create"
      : null;

  async function registerWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <header className={styles.nav}>
            <span className={styles.brand}>
              <BrandMark size={30} />
              BolDukaan
            </span>
            <nav className={styles.navLinks} aria-label="Main">
              <Link href="/nearby" className={styles.navLink}>
                {tr.navFind}
              </Link>
              <RegisterCta
                target={registerTarget}
                action={registerWithGoogle}
                className={styles.navLink}
              >
                {tr.navRegister}
              </RegisterCta>
              <a href="#about" className={styles.navLink}>
                {tr.navAbout}
              </a>
            </nav>
            <div className={styles.langSlot}>
              <LangSwitcher current={lang} />
            </div>
          </header>

          <h1 className={styles.title}>
            {tr.titlePre}
            <span className={styles.amber}>{tr.titleAccent}</span>
            {tr.titlePost}
          </h1>
          <p className={styles.subline}>{tr.landingSub}</p>

          <div className={styles.ctaRow}>
            <Link href="/nearby" className={styles.ctaCard}>
              <span className={styles.ctaIcon} aria-hidden>
                🔍
              </span>
              <span>
                <span className={styles.ctaTitle}>{tr.findShopsCta}</span>
                <span className={styles.ctaSub}>{tr.findShopsSub}</span>
              </span>
            </Link>
            <RegisterCta
              target={registerTarget}
              action={registerWithGoogle}
              className={`${styles.ctaCard} ${styles.ctaRegister}`}
            >
              <span className={styles.ctaIcon} aria-hidden>
                🏪
              </span>
              <span>
                <span className={styles.ctaTitle}>{tr.registerShopCta}</span>
                <span className={styles.ctaSub}>{tr.registerShopSub}</span>
              </span>
            </RegisterCta>
          </div>

          <div className={styles.trustRow}>
            {tr.trustItems.map((item) => (
              <span key={item} className={styles.trustChip}>
                <span className={styles.trustTick} aria-hidden>
                  ✓
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>{tr.demoTitle}</h2>
          <LandingDemo
            youSpeak={tr.demoYouSpeak}
            transcript={tr.demoTranscript}
            steps={tr.demoSteps}
          />
        </div>
      </section>

      <section id="about" className={styles.about}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>{tr.aboutTitle}</h2>
          <p className={styles.aboutBody}>{tr.aboutBody}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>{tr.madeWith}</div>
      </footer>
    </div>
  );
}
