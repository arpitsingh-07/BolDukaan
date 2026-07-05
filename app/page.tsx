import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { LangSwitcher } from "@/components/LangSwitcher";
import { LandingDemo } from "@/components/LandingDemo";
import { BrandMark } from "@/components/BrandMark";
import { BrandName } from "@/components/BrandName";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

/** "Register your shop" — links to the sign-in gate (or dashboard if signed in). */
function RegisterCta({
  target,
  className,
  children,
}: {
  target: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <Link href={target} className={className}>
      {children}
    </Link>
  );
}

/**
 * Public landing page — the entry point for both audiences: customers go to
 * nearby discovery, owners go through the sign-in gate (email/password or
 * Google) into the voice builder.
 */
export default async function LandingPage() {
  const session = await auth();
  const lang = (await viewerLang()) ?? "hi";
  const tr = t(lang);

  // Signed-in owners jump to their dashboard; everyone else hits the /create
  // gate, which offers email/password + Google before the builder.
  const registerTarget = session?.user ? "/dashboard" : "/create";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <header className={styles.nav}>
            <span className={styles.brand}>
              <BrandMark size={30} />
              <BrandName tone="dark" />
            </span>
            <nav className={styles.navLinks} aria-label="Main">
              <Link href="/nearby" className={styles.navLink}>
                {tr.navFind}
              </Link>
              <RegisterCta target={registerTarget} className={styles.navLink}>
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
