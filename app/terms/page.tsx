import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { BrandName } from "@/components/BrandName";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms & Conditions · BolDukaan",
  description:
    "The agreement between you and BolDukaan when you create and share a voice-built storefront, including accounts, plans, payments, and acceptable use.",
};

// Bump when the terms change materially.
const LAST_UPDATED = "5 July 2026";
const CONTACT_EMAIL = "boldukaan@gmail.com";
const INSTAGRAM_HANDLE = "boldukaan.in";
const INSTAGRAM_URL = "https://instagram.com/boldukaan.in";
const PRO_PRICE = "₹249";

/**
 * Plain-language Terms & Conditions covering the launch feature set: accounts
 * (email/password + Google), public voice-built storefronts, AI structuring,
 * the Free/Pro plans billed via Razorpay, cancellation/refunds, acceptable
 * use, and takedown rights. Body is English (one authoritative text); chrome
 * follows the viewer's language.
 */
export default async function TermsPage() {
  const tr = t((await viewerLang()) ?? "hi");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <BrandMark size={26} />
            <BrandName tone="dark" />
          </Link>
          <h1 className={styles.title}>Terms &amp; Conditions</h1>
          <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.intro}>
          These terms are the agreement between you and BolDukaan when you use
          the service. By creating an account or using BolDukaan, you agree to
          them. We’ve kept them short and in plain language. How we handle your
          data is covered separately in our{" "}
          <Link href="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          .
        </p>

        <section className={styles.section}>
          <h2 className={styles.h2}>1. What BolDukaan is</h2>
          <p className={styles.p}>
            BolDukaan lets a shop owner create a public “storefront” by voice —
            a digital visiting card, product catalogue, QR code, and shareable
            link. It is a <strong>showcase (brochure) service, not an online
            shopping cart or marketplace</strong>. BolDukaan does not take
            orders, process purchases, arrange delivery, or act as a middleman
            between a shop and its customers. Anything that happens next — a
            customer calling or visiting the shop — is directly between them.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>2. Who can use it</h2>
          <p className={styles.p}>
            You must be at least 18 years old (or the age of majority where you
            live) and able to enter into a contract. You should be the owner of,
            or authorised to represent, the shop you list.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>3. Your account</h2>
          <ul className={styles.list}>
            <li>
              You can sign up with an email and password, or with Google.
            </li>
            <li>
              Keep your login details safe. You are responsible for activity
              under your account.
            </li>
            <li>Give accurate information and keep it up to date.</li>
            <li>Tell us promptly if you suspect any unauthorised use.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>4. Your content and your responsibility</h2>
          <p className={styles.p}>
            “Your content” is everything you add to a storefront: the shop name,
            description, products, prices, hours, phone and WhatsApp numbers,
            address, photos, and the transcript of what you spoke.
          </p>
          <ul className={styles.list}>
            <li>
              You are responsible for it being accurate, lawful, and not
              misleading.
            </li>
            <li>
              You must own, or have permission to use, everything you upload —
              including photos, logos, and names.
            </li>
            <li>
              Prices, offers, and product claims are yours; BolDukaan does not
              verify them.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>5. AI-assisted building</h2>
          <p className={styles.p}>
            Your spoken description is turned into text by your browser and then
            structured into shop details by AI (Google Gemini). AI can make
            mistakes. Please review your storefront before publishing — the
            final published content is your responsibility.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>6. Acceptable use</h2>
          <p className={styles.p}>You agree not to use BolDukaan to:</p>
          <ul className={styles.list}>
            <li>
              list illegal or restricted goods or services (for example drugs,
              weapons, counterfeit or smuggled goods, or anything banned by
              law);
            </li>
            <li>
              commit fraud, run scams, impersonate others, or claim to represent
              a business you don’t;
            </li>
            <li>
              infringe anyone’s copyright, trademark, or privacy, or misuse
              other people’s phone numbers or personal data;
            </li>
            <li>post hateful, obscene, or otherwise harmful content; or</li>
            <li>
              break any applicable Indian law, including consumer-protection and
              advertising rules.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>7. The licence you give us</h2>
          <p className={styles.p}>
            To run the service, you give BolDukaan a non-exclusive licence to
            host, store, display, reproduce, and distribute your content so we
            can generate your public page, QR code, poster, catalogue, share
            links, and nearby listings. <strong>You keep ownership of your
            content.</strong> This licence ends when you delete the content or
            your account, except for copies you have already shared publicly and
            cached copies that take a short time to clear.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>8. Public storefronts</h2>
          <p className={styles.p}>
            A published storefront is public by design. Anyone with the link can
            see it, and it may appear in “shops near you” with your approximate
            location. BolDukaan is not responsible for how visitors use
            information you chose to make public. You can unpublish or delete a
            shop at any time from your dashboard.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>9. Plans, pricing, and payments</h2>
          <ul className={styles.list}>
            <li>
              <strong>Free plan:</strong> one storefront, the classic theme, and
              a “Made with BolDukaan” badge.
            </li>
            <li>
              <strong>Pro plan:</strong> a paid subscription (currently{" "}
              {PRO_PRICE}/month) with more storefronts, all themes, branding
              removed, and edit-by-voice. Features and price may change; the
              current details are always shown at checkout.
            </li>
            <li>
              Payments are processed by <strong>Razorpay</strong>. By
              subscribing, you also agree to Razorpay’s terms. BolDukaan never
              sees your full card details.
            </li>
            <li>
              Subscriptions renew automatically each period until you cancel.
              Prices include applicable taxes unless stated otherwise.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>10. Cancellation and refunds</h2>
          <p className={styles.p}>
            You can cancel any time from your account. Your Pro features
            continue until the end of the current paid period, after which you
            return to the Free plan. Because Pro is a digital service that starts
            immediately, fees already paid are generally non-refundable except
            where the law requires otherwise. If you were charged in error, or
            you believe there is a genuine problem, contact us within 7 days and
            we will review it in good faith.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>11. Suspension and termination</h2>
          <p className={styles.p}>
            We may remove content, or suspend or close an account, if it breaks
            these terms or the law, or where needed to protect users or the
            service. You may stop using BolDukaan and delete your shops or
            account at any time. When an account ends, its storefronts come down
            and data is deleted as described in our{" "}
            <Link href="/privacy" className={styles.link}>
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>12. Services we rely on</h2>
          <p className={styles.p}>
            BolDukaan uses Google (sign-in), Google Gemini (structuring your
            transcript), Neon (database), Vercel (hosting), Razorpay (payments),
            and messaging apps such as WhatsApp for sharing. Your use of those
            may be subject to their own terms, and we are not responsible for
            them.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>13. Availability and changes</h2>
          <p className={styles.p}>
            We work to keep BolDukaan available but cannot promise it will always
            be uninterrupted or error-free. We may add, change, or remove
            features, and we may update these terms. If we make important
            changes, we’ll update the date at the top of this page.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>14. Disclaimers</h2>
          <p className={styles.p}>
            BolDukaan is provided “as is” and “as available,” without warranties
            of any kind. We do not guarantee results — such as customers, sales,
            or search ranking — or that AI-structured details will be
            error-free. We are not a party to any dealing between a shop and its
            customers.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>15. Limitation of liability</h2>
          <p className={styles.p}>
            To the fullest extent allowed by law, BolDukaan is not liable for
            indirect, incidental, or consequential losses. Our total liability
            for any claim is limited to the amount you paid us in the three
            months before the claim (which is nil if you are on the Free plan).
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>16. Your indemnity</h2>
          <p className={styles.p}>
            You agree to cover BolDukaan for claims, losses, and costs that arise
            from your content, or from your breach of these terms or the law.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>17. Governing law</h2>
          <p className={styles.p}>
            These terms are governed by the laws of India, and any disputes are
            subject to the jurisdiction of the courts of India.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>18. Contact</h2>
          <p className={styles.p}>
            Questions about these terms? Email{" "}
            <a className={styles.link} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
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
