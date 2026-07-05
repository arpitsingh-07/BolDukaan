"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { t, type UiLang } from "@/lib/i18n";
import styles from "./auth-form.module.css";

/** Render a template with {terms} and {privacy} tokens as policy links. */
function withLegalLinks(
  template: string,
  termsLabel: string,
  privacyLabel: string,
): ReactNode {
  return template.split(/(\{terms\}|\{privacy\})/).map((part, i) => {
    if (part === "{terms}") {
      return (
        <Link
          key={i}
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.policyLink}
        >
          {termsLabel}
        </Link>
      );
    }
    if (part === "{privacy}") {
      return (
        <Link
          key={i}
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.policyLink}
        >
          {privacyLabel}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Account creation requires accepting the Privacy Policy (also enforced
    // server-side in the register route).
    if (mode === "create" && !agreed) {
      setError(tr.authMustAgree);
      return;
    }
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
            agreedToTerms: agreed,
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

          {mode === "create" && (
            <label className={styles.consent}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                {withLegalLinks(tr.authAgree, tr.terms, tr.privacyPolicy)}
              </span>
            </label>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.primary}
            disabled={busy || (mode === "create" && !agreed)}
          >
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
          <p className={styles.consentNote}>
            {withLegalLinks(tr.authGoogleConsent, tr.terms, tr.privacyPolicy)}
          </p>
        </>
      )}
    </div>
  );
}
