import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { BrandName } from "@/components/BrandName";
import styles from "./coming-soon.module.css";

export const metadata: Metadata = {
  title: "BolDukaan™ — Coming Soon",
  description:
    "Voice-to-website storefronts for local shops. Bolo, aur dukaan taiyaar. Launching soon.",
  // Don't let the holding page get indexed under real URLs — it's rewritten
  // onto every route, and we want a clean index once the site actually launches.
  robots: { index: false, follow: false },
};

/**
 * Pre-launch holding page. Every route is rewritten here by middleware.ts while
 * COMING_SOON is on, so the full app + data stay intact behind the gate —
 * flip COMING_SOON=off (or delete middleware.ts) to reveal the real site.
 */
export default function ComingSoonPage() {
  return (
    <main className={styles.page}>
      <div className={styles.frame} aria-hidden />
      <div className={styles.inner}>
        <span className={styles.brand}>
          <BrandMark size={30} />
          <BrandName tone="dark" />
        </span>

        <div className={styles.voice} aria-hidden>
          <span className={`${styles.ring} ${styles.r1}`} />
          <span className={`${styles.ring} ${styles.r2}`} />
          <span className={styles.dot}>
            <span className={styles.bars}>
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </span>
        </div>

        <h1 className={styles.title}>
          Coming<span className={styles.accent}> Soon…</span>
        </h1>
        <p className={styles.hi}>आपकी दुकान, जल्द ऑनलाइन।</p>
        <p className={styles.sub}>
          Voice-to-website storefronts for local shops — speak once, and your
          shop page, catalogue and QR build themselves.
        </p>

        <div className={styles.footer}>
          <span className={styles.url}>boldukaan.com</span>
          <span className={styles.langs}>
            हिंदी · ਪੰਜਾਬੀ · English · + more languages soon
          </span>
          <a className={styles.contact} href="mailto:hello@boldukaan.com">
            hello@boldukaan.com
          </a>
        </div>
      </div>
    </main>
  );
}
