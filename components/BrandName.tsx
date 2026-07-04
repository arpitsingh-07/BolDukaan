import styles from "./brand-mark.module.css";

/**
 * The wordmark, two-toned like the logo: "Bol" inherits the surrounding
 * brand color, "Dukaan" takes marigold (deep variant on light grounds).
 * Wrapped in one span so flex-gap brand rows treat it as a single item.
 */
export function BrandName({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span>
      {"Bol"}
      <span
        className={tone === "dark" ? styles.dukaanDark : styles.dukaanLight}
      >
        Dukaan
      </span>
    </span>
  );
}
