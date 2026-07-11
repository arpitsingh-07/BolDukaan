import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { BrandName } from "@/components/BrandName";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import styles from "../legal.module.css";
import support from "./support.module.css";

export const metadata: Metadata = {
  title: "Support · BolDukaan",
  description:
    "Get help with BolDukaan — email our support team and find quick answers to common questions about your voice-built storefront.",
};

// Primary support inbox. Sibling role mailboxes: legal@boldukaan.com (used on
// the terms/privacy pages) and hello@boldukaan.com (general contact).
const SUPPORT_EMAIL = "support@boldukaan.com";
const MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "BolDukaan support request",
)}`;
const INSTAGRAM_HANDLE = "boldukaan.in";
const INSTAGRAM_URL = "https://instagram.com/boldukaan.in";

/**
 * Support page. Its one job is to get a shop owner to our inbox quickly, with
 * a prominent mailto CTA, plus a few self-serve pointers for the things people
 * ask about most. Body is English (one authoritative text); the surrounding
 * chrome follows the viewer's language, matching the legal pages.
 */
export default async function SupportPage() {
  const tr = t((await viewerLang()) ?? "hi");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <BrandMark size={26} />
            <BrandName tone="dark" />
          </Link>
          <h1 className={styles.title}>Support</h1>
          <p className={styles.updated}>We&rsquo;re here to help</p>
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.intro}>
          Stuck on something, or found a problem? Email us and a real person
          will get back to you. Tell us your shop&rsquo;s name and what
          happened, so we can help faster.
        </p>

        <div className={support.emailCard}>
          <p className={support.emailLabel}>Email us</p>
          <p className={support.emailAddress}>{SUPPORT_EMAIL}</p>
          <a className={support.emailButton} href={MAILTO}>
            Write to support
          </a>
        </div>

        <section className={styles.section}>
          <h2 className={styles.h2}>When to expect a reply</h2>
          <p className={styles.p}>
            We usually reply within 1&ndash;2 working days. For billing issues,
            please write from the email address on your BolDukaan account so we
            can find you quickly.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>What you can tell us</h2>
          <ul className={styles.list}>
            <li>
              <strong>Your shop.</strong> The name of your shop or its page
              link (for example, boldukaan.com/s/your-shop).
            </li>
            <li>
              <strong>What went wrong.</strong> What you were trying to do and
              what happened instead.
            </li>
            <li>
              <strong>Your phone or browser.</strong> If voice or a button
              isn&rsquo;t working, telling us the phone and browser you use
              helps a lot.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Quick answers</h2>
          <ul className={styles.list}>
            <li>
              <strong>Edit or delete a shop.</strong> Sign in and open your{" "}
              <Link href="/dashboard" className={styles.link}>
                dashboard
              </Link>{" "}
              &mdash; every shop has edit, unpublish, and delete actions.
            </li>
            <li>
              <strong>Delete your whole account.</strong> Use &ldquo;Delete
              account&rdquo; at the bottom of your dashboard, or email us and we
              will do it for you.
            </li>
            <li>
              <strong>Report a shop.</strong> Open the shop&rsquo;s public page
              and use &ldquo;Report this shop,&rdquo; or email us the link.
            </li>
            <li>
              <strong>Plans and billing.</strong> See{" "}
              <Link href="/dashboard/billing" className={styles.link}>
                Plan &amp; billing
              </Link>{" "}
              in your dashboard for your current plan.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Prefer Instagram?</h2>
          <p className={styles.p}>
            You can also reach us on Instagram at{" "}
            <a
              className={styles.link}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{INSTAGRAM_HANDLE}
            </a>
            . For anything about your account or billing, email is best.
          </p>
        </section>

        <p className={styles.p}>
          See also our{" "}
          <Link href="/privacy" className={styles.link}>
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className={styles.link}>
            Terms &amp; Conditions
          </Link>
          .
        </p>

        <Link href="/" className={styles.back}>
          {tr.gateBack}
        </Link>
      </main>
    </div>
  );
}
