"use client";

import { useEffect, useState } from "react";
import styles from "./share-button.module.css";

/**
 * "Share on WhatsApp" — builds a wa.me link to share THIS page's URL.
 * The URL is only known in the browser, so we set the href after mount.
 */
export function ShareButton({
  name,
  url,
}: {
  name: string | null;
  /** URL to share. Defaults to the current page (used on the public page). */
  url?: string;
}) {
  const [href, setHref] = useState<string>("#");

  useEffect(() => {
    const target = url ?? window.location.href;
    const label = name ? `${name} — ` : "";
    const text = `${label}dekho meri dukaan / check out my shop: ${target}`;
    setHref(`https://wa.me/?text=${encodeURIComponent(text)}`);
  }, [name, url]);

  return (
    <a
      className={styles.share}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.icon} aria-hidden>
        {/* simple WhatsApp glyph */}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.2c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2Zm0 18.1c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.15.82.84-3.07-.2-.32a8.2 8.2 0 1 1 7.06 4.09Zm4.5-6.15c-.25-.12-1.46-.72-1.68-.8-.22-.08-.38-.12-.55.12-.16.25-.63.8-.77.96-.14.16-.28.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.36-1.7-.14-.25-.02-.38.1-.5.1-.1.25-.28.37-.42.12-.14.16-.24.25-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.65.57.25 1.02.4 1.37.5.57.18 1.1.16 1.51.1.46-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28Z" />
        </svg>
      </span>
      Share on WhatsApp
    </a>
  );
}
