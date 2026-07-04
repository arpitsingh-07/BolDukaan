/**
 * Re-mounts on every route navigation (unlike layout), so each page plays a
 * short fade-up entrance — transform/opacity only, disabled globally by the
 * prefers-reduced-motion rule in globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
