import styles from "./brand-mark.module.css";

/** The BolDukaan logo mark (shopfront in a speech bubble), chip-styled. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      className={styles.mark}
    />
  );
}
