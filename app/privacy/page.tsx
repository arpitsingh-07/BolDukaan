import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { BrandName } from "@/components/BrandName";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy · BolDukaan",
  description:
    "How BolDukaan collects, uses, and protects your information when you create and share a voice-built storefront.",
};

// Bump when the policy text materially changes.
const LAST_UPDATED = "5 July 2026";
// Role-based mailboxes on the custom domain. Account/data actions (like
// deletion) go to support@; privacy & data-rights questions go to legal@.
// Instagram handle is @boldukaan.in (boldukaan and boldukaan.com were taken).
const SUPPORT_EMAIL = "support@boldukaan.com";
const LEGAL_EMAIL = "legal@boldukaan.com";
const INSTAGRAM_HANDLE = "boldukaan.in";
const INSTAGRAM_URL = "https://instagram.com/boldukaan.in";

/**
 * Plain-language privacy policy. The body is intentionally English (a single
 * authoritative legal text); only the surrounding chrome follows the viewer's
 * language. Content mirrors what the app actually does — accounts, shop data,
 * optional location, in-browser voice transcription, and the processors that
 * run the service.
 */
export default async function PrivacyPage() {
  const tr = t((await viewerLang()) ?? "hi");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <BrandMark size={26} />
            <BrandName tone="dark" />
          </Link>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.intro}>
          BolDukaan helps small shops get online by voice. This policy explains
          what we collect, why, and the choices you have. We keep it short and
          in plain language.
        </p>

        <section className={styles.section}>
          <h2 className={styles.h2}>Information we collect</h2>
          <ul className={styles.list}>
            <li>
              <strong>Account details.</strong> If you sign up with email and
              password, we store your email address and a securely hashed
              version of your password (never the password itself). If you sign
              in with Google, we receive your name, email address, and profile
              basics from Google.
            </li>
            <li>
              <strong>Your shop content.</strong> Whatever you add to your
              storefront — shop name, description, products, prices, opening
              hours, phone number, WhatsApp number, address, and photos — plus
              the transcript of what you spoke to build it.
            </li>
            <li>
              <strong>Location (only if you choose).</strong> If you tap “Set
              shop location,” we store your shop’s coordinates so nearby
              customers can find it. When a visitor searches “shops near you,”
              their location is used only for that one search and is never
              stored.
            </li>
            <li>
              <strong>Basic usage.</strong> We count views on your public shop
              page so you can see how many people visited.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>How your voice is handled</h2>
          <p className={styles.p}>
            Your speech is turned into text by your browser’s built-in
            speech-recognition feature. Depending on which browser you use
            (for example, Chrome), the audio may be processed by your browser
            provider’s servers to produce the text. BolDukaan receives only the
            resulting text — we do not record or store your audio.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>How we use your information</h2>
          <ul className={styles.list}>
            <li>To build, host, and display your storefront page.</li>
            <li>To power “shops near you” discovery when you add a location.</li>
            <li>To let you sign in and manage your shops.</li>
            <li>To process payments if you upgrade to a paid plan.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>What is public</h2>
          <p className={styles.p}>
            A published storefront is public by design. Its contents — shop
            name, products, hours, address, phone, WhatsApp, photos, and
            approximate location — can be seen by anyone with the link and may
            appear in nearby search. Your email address and password are never
            shown publicly. You can unpublish or delete a shop at any time from
            your dashboard.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Services that help us run BolDukaan</h2>
          <p className={styles.p}>
            We share only what each service needs to do its job:
          </p>
          <ul className={styles.list}>
            <li>
              <strong>Google</strong> — optional sign-in.
            </li>
            <li>
              <strong>Google Gemini</strong> — turns your spoken transcript into
              structured shop details.
            </li>
            <li>
              <strong>Neon</strong> — the database that stores your shop data.
            </li>
            <li>
              <strong>Vercel</strong> — hosts and serves the app.
            </li>
            <li>
              <strong>Razorpay</strong> — processes payments for paid plans (we
              never see your full card details).
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Keeping your data & your choices</h2>
          <ul className={styles.list}>
            <li>
              We keep your shop data until you delete the shop or your account.
            </li>
            <li>
              You can edit or delete any shop yourself from the dashboard.
            </li>
            <li>
              To delete your entire account and everything in it, email us at{" "}
              <a className={styles.link} href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              .
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Security</h2>
          <p className={styles.p}>
            Passwords are stored only as a bcrypt hash, and the app is served
            over HTTPS. No online service can promise perfect security, but we
            take reasonable steps to protect your information.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Children</h2>
          <p className={styles.p}>
            BolDukaan is meant for shop owners and is not directed at children
            under 13.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Changes & contact</h2>
          <p className={styles.p}>
            If we make important changes, we’ll update the date at the top of
            this page. Questions or requests? Email{" "}
            <a className={styles.link} href={`mailto:${LEGAL_EMAIL}`}>
              {LEGAL_EMAIL}
            </a>{" "}
            or reach us on Instagram at{" "}
            <a
              className={styles.link}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{INSTAGRAM_HANDLE}
            </a>
            .
          </p>
        </section>

        <Link href="/" className={styles.back}>
          {tr.gateBack}
        </Link>
      </main>
    </div>
  );
}
