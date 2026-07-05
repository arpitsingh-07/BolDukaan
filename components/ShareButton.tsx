"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "./WhatsAppIcon";
import styles from "./share-button.module.css";

/**
 * "Share on WhatsApp" — builds a wa.me link sharing a URL.
 * `label`/`shareText` are passed in so the caller controls the language
 * (public pages use the shop's language).
 */
export function ShareButton({
  name,
  url,
  label = "Share on WhatsApp",
  shareText = "check out my shop",
  fullText,
}: {
  name: string | null;
  /** URL to share. Defaults to the current page (used on the public page). */
  url?: string;
  label?: string;
  shareText?: string;
  /** Complete pre-built message (incl. URL) — overrides name/shareText/url. */
  fullText?: string;
}) {
  const [href, setHref] = useState<string>("#");

  useEffect(() => {
    // rAF keeps the state write out of the effect body (no cascading render).
    const raf = requestAnimationFrame(() => {
      const target = url ?? window.location.href;
      const prefix = name ? `${name} — ` : "";
      const text = fullText ?? `${prefix}${shareText}: ${target}`;
      setHref(`https://wa.me/?text=${encodeURIComponent(text)}`);
    });
    return () => cancelAnimationFrame(raf);
  }, [name, url, shareText, fullText]);

  return (
    <a
      className={styles.share}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.icon} aria-hidden>
        <WhatsAppIcon />
      </span>
      {label}
    </a>
  );
}
