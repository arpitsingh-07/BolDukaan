import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js (NextAuth v5) — Google sign-in with stateless JWT sessions.
 * The signed-in user's stable id (Google `sub`) becomes `session.user.id`,
 * which we use as `owner_user_id` for multi-tenant scoping. No DB session
 * table needed — the session lives in an encrypted cookie.
 *
 * Env (Auth.js auto-reads AUTH_*): AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET.
 */

// Make session.user.id available and typed everywhere.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true, // required off-Vercel (local/self-hosted)
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
