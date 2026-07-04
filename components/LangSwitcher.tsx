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
 * Language selector for server-rendered pages (landing): a segmented switch
 * whose paper key slides to the chosen language, then re-renders the page in
 * that language.
 */
export function LangSwitcher({ current }: { current: UiLang }) {
  const router = useRouter();
  const index = Math.max(
    0,
    UI_LANGS.findIndex((l) => l.code === current),
  );

  const change = (lang: UiLang) => {
    persistLang(lang);
    router.refresh();
  };

  return (
    <div className={styles.track} role="group" aria-label="Language">
      <span
        className={styles.thumb}
        style={{ transform: `translateX(${index * 100}%)` }}
        aria-hidden
      />
      {UI_LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={current === l.code ? styles.segActive : styles.seg}
          aria-pressed={current === l.code}
          onClick={() => change(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
