import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import { NearbyBrowser } from "@/components/NearbyBrowser";
import styles from "./nearby.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shops near you · BolDukaan" };

export default async function NearbyPage() {
  const lang = (await viewerLang()) ?? "hi";
  const tr = t(lang);

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <p className={styles.brand}>
          <span className={styles.brandDot} />
          BolDukaan
        </p>
        <h1 className={styles.title}>{tr.nearbyTitle}</h1>
        <p className={styles.intro}>{tr.nearbyIntro}</p>
        <NearbyBrowser lang={lang} />
      </div>
    </main>
  );
}
