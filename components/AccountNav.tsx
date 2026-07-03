import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import styles from "./account-nav.module.css";

/** Google OAuth env present? (Server components can read env directly.) */
export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

/** Top-right account controls. Server component — reads the session directly. */
export async function AccountNav() {
  const session = await auth();
  const tr = t((await viewerLang()) ?? "hi");

  // No session and sign-in can't work yet — render nothing rather than a
  // button that dead-ends on the NextAuth error page.
  if (!session?.user && !authConfigured()) return null;

  return (
    <nav className={styles.nav}>
      {session?.user ? (
        <>
          <Link href="/dashboard" className={styles.link}>
            {tr.navDashboard}
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className={styles.btn}>
              {tr.navSignOut}
            </button>
          </form>
        </>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button type="submit" className={styles.btn}>
            {tr.navSignIn}
          </button>
        </form>
      )}
    </nav>
  );
}
