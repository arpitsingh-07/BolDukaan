import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontCard } from "@/components/StorefrontCard";
import { ShareButton } from "@/components/ShareButton";
import { getActiveStorefrontBySlug } from "@/lib/shops";
import styles from "./public.module.css";

// Always render on demand (fresh from the DB) — never statically cached.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const sf = await getActiveStorefrontBySlug(slug).catch(() => null);

  if (!sf) {
    return { title: "Shop not found · BolDukaan" };
  }

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
  const sf = await getActiveStorefrontBySlug(slug).catch(() => null);

  if (!sf) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <p className={styles.brand}>
          <span className={styles.brandDot} />
          BolDukaan
        </p>

        <StorefrontCard storefront={sf} />

        <div className={styles.shareRow}>
          <ShareButton name={sf.name} />
        </div>

        <footer className={styles.footer}>
          <a href="/" className={styles.footerLink}>
            Made with BolDukaan — speak your shop into existence
          </a>
        </footer>
      </div>
    </main>
  );
}
