"use client";

import { useRouter } from "next/navigation";
import { UI_LANGS, LANG_COOKIE, type UiLang } from "@/lib/i18n";
import styles from "./lang-switcher.module.css";

/** Must match the key VoiceOnboarding reads on mount. */
const LANG_STORAGE_KEY = "boldukaan.lang.v1";

/** Persist the language for BOTH worlds: localStorage (client) + cookie (server). */
function persistLang(lang: UiLang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Compact language chips for server-rendered pages (landing). Persists the
 * choice, then re-renders the page in the new language.
 */
export function LangSwitcher({ current }: { current: UiLang }) {
  const router = useRouter();

  const change = (lang: UiLang) => {
    persistLang(lang);
    router.refresh();
  };

  return (
    <div className={styles.row} role="group" aria-label="Language">
      {UI_LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={current === l.code ? styles.chipActive : styles.chip}
          aria-pressed={current === l.code}
          onClick={() => change(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
