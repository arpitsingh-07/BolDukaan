import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { StorefrontCard } from "@/components/StorefrontCard";
import { ShareButton } from "@/components/ShareButton";
import { BrandMark } from "@/components/BrandMark";
import { BrandName } from "@/components/BrandName";
import { getPublicShopBySlug, recordView } from "@/lib/shops";
import { normalizeLang, t } from "@/lib/i18n";
import { localBusinessJsonLd, jsonLdScript } from "@/lib/seo";
import { viewerLang } from "@/lib/server-lang";
import styles from "./public.module.css";

// Always render on demand (fresh from the DB) — never statically cached.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShopBySlug(slug).catch(() => null);

  if (!shop) {
    return { title: "Shop not found · BolDukaan" };
  }

  const sf = shop.storefront;
  const title = sf.name ? `${sf.name} · BolDukaan` : "Storefront · BolDukaan";
  const description =
    sf.tagline ??
    sf.about ??
    `${sf.name ?? "This shop"}${sf.address ? ` · ${sf.address}` : ""}`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicStorefrontPage({ params }: Params) {
  const { slug } = await params;
  const shop = await getPublicShopBySlug(slug).catch(() => null);

  if (!shop) notFound();

  // Basic analytics — count the visit (best-effort).
  await recordView(slug).catch(() => {});

  // Free plan (or unowned) shows branding; Pro removes it.
  const showBranding = !shop.ownerIsPro;

  // If the signed-in viewer owns this shop, offer a way back to editing.
  // Purely additive: anonymous visitors take the identical read-only path.
  const session = await auth();
  const isOwner = Boolean(
    session?.user?.id &&
      shop.ownerUserId &&
      session.user.id === shop.ownerUserId,
  );

  // The viewer's chosen language wins; a first-time visitor with no choice
  // gets the shop's own language (its customers read that language).
  const lang = (await viewerLang()) ?? normalizeLang(shop.storefront.language);
  const tr = t(lang);

  // Absolute URL for structured data (works behind Vercel's proxy too).
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const pageUrl = host ? `${proto}://${host}/s/${slug}` : `/s/${slug}`;

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(localBusinessJsonLd(shop.storefront, pageUrl)),
        }}
      />
      <div className={styles.wrap}>
        {isOwner && (
          <div className={styles.ownerBar}>
            <span>This is your shop — you&apos;re seeing it as visitors do.</span>
            <span className={styles.ownerBarLinks}>
              <Link href={`/dashboard/${slug}/edit`}>Edit</Link>
              <Link href="/dashboard">Dashboard</Link>
            </span>
          </div>
        )}
        <p className={styles.brand}>
          <BrandMark size={24} />
          <BrandName tone="light" />
        </p>

        <StorefrontCard
          storefront={shop.storefront}
          theme={shop.theme}
          lang={lang}
          forceClosed={shop.manuallyClosed}
        />

        <div className={styles.shareRow}>
          <ShareButton
            name={shop.storefront.name}
            label={tr.shareOnWhatsApp}
            shareText={tr.shareText}
          />
        </div>

        {showBranding && (
          <footer className={styles.footer}>
            <Link href="/" className={styles.footerLink}>
              {tr.madeWith}
            </Link>
          </footer>
        )}
      </div>
    </main>
  );
}
