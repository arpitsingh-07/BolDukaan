import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/users";

/**
 * Auth.js (NextAuth v5) — two sign-in paths, both stateless JWT sessions:
 *   - Google OAuth (session.user.id = Google `sub`)
 *   - Email + password (session.user.id = our users.id)
 * Either id becomes `owner_user_id` for multi-tenant scoping. No DB session
 * table needed — the session lives in an encrypted cookie.
 *
 * Env (Auth.js auto-reads AUTH_*): AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET.
 * Google is optional; if its env is absent that provider simply stays inert.
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
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Returns a user object on success, or null on any failure. Never throws
      // detail — NextAuth turns a null into a generic CredentialsSignin error,
      // so we don't leak whether the email exists.
      async authorize(raw) {
        const email = typeof raw?.email === "string" ? raw.email : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!email || !password) return null;
        try {
          const user = await verifyCredentials(email, password);
          if (!user) return null;
          return { id: user.id, email: user.email, name: user.name };
        } catch {
          return null;
        }
      },
    }),
  ],
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
