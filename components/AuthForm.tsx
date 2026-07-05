"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { t, type UiLang } from "@/lib/i18n";
import styles from "./auth-form.module.css";

/**
 * Email/password sign-in + registration, with the Google button as an
 * alternate. Lives on the petrol gate. On success we hard-navigate to
 * `redirectTo` so the freshly-set session cookie is read by the server
 * components on the next page.
 */
export function AuthForm({
  redirectTo,
  credentialsEnabled,
  googleEnabled,
  lang,
}: {
  redirectTo: string;
  credentialsEnabled: boolean;
  googleEnabled: boolean;
  lang: UiLang;
}) {
  const tr = t(lang);
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Create-account first registers the row, then signs in with the same
      // credentials below.
      if (mode === "create") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: name.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? tr.authGeneric);
          setBusy(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError(mode === "create" ? tr.authGeneric : tr.authInvalid);
        setBusy(false);
        return;
      }

      // Hard navigation guarantees the new session cookie is picked up.
      window.location.assign(redirectTo);
    } catch {
      setError(tr.authGeneric);
      setBusy(false);
    }
  }

  return (
    <div>
      {credentialsEnabled && (
        <form className={styles.form} onSubmit={onSubmit}>
          {mode === "create" && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="af-name">
                {tr.authName}
              </label>
              <input
                id="af-name"
                className={styles.input}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="af-email">
              {tr.authEmail}
            </label>
            <input
              id="af-email"
              className={styles.input}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="af-password">
              {tr.authPassword}
            </label>
            <input
              id="af-password"
              className={styles.input}
              type="password"
              autoComplete={
                mode === "create" ? "new-password" : "current-password"
              }
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primary} disabled={busy}>
            {busy
              ? tr.authBusy
              : mode === "create"
                ? tr.authCreateCta
                : tr.authSignInCta}
          </button>

          <button
            type="button"
            className={styles.toggle}
            onClick={() => {
              setMode(mode === "create" ? "signin" : "create");
              setError(null);
            }}
          >
            {mode === "create" ? tr.authToSignIn : tr.authToCreate}
          </button>
        </form>
      )}

      {googleEnabled && (
        <>
          {credentialsEnabled && <div className={styles.divider}>{tr.authOr}</div>}
          <button
            type="button"
            className={styles.google}
            onClick={() => signIn("google", { redirectTo })}
          >
            <span className={styles.googleGlyph} aria-hidden>
              G
            </span>
            {tr.gateSignInGoogle}
          </button>
        </>
      )}
    </div>
  );
}
