import bcrypt from "bcryptjs";
import { getSql } from "./db";

/**
 * Email/password accounts. A user's `id` is used directly as `owner_user_id`
 * everywhere shops are tenant-scoped — the same slot a Google `sub` fills for
 * OAuth users. Passwords are only ever stored as a bcrypt hash; the plaintext
 * never leaves this module and is never logged.
 */

const BCRYPT_COST = 12;

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Basic shape check — real deliverability is out of scope (no email sending). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Permanently delete an account and everything it owns: shops (storefronts
 * cascade), the subscription, and — for email/password users — the users row.
 * For Google users the users delete matches nothing (their owner id is a
 * Google sub), which is fine; their shops and subscription still go.
 */
export async function deleteAccount(ownerUserId: string): Promise<void> {
  const sql = getSql();
  await sql.transaction([
    sql`DELETE FROM shops WHERE owner_user_id = ${ownerUserId}`,
    sql`DELETE FROM subscriptions WHERE owner_user_id = ${ownerUserId}`,
    sql`DELETE FROM users WHERE id = ${ownerUserId}`,
  ]);
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, email, name FROM users WHERE lower(email) = ${normalizeEmail(email)} LIMIT 1`;
  if (rows.length === 0) return null;
  return {
    id: rows[0].id as string,
    email: rows[0].email as string,
    name: (rows[0].name as string) ?? null,
  };
}

/**
 * Create a credential account. Returns the new user, or `null` if the email is
 * already registered (the unique index also guards against a race).
 */
export async function createUser(input: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<AppUser | null> {
  const sql = getSql();
  const email = normalizeEmail(input.email);
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const name = input.name?.trim() || null;
  try {
    const rows = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name`;
    return {
      id: rows[0].id as string,
      email: rows[0].email as string,
      name: (rows[0].name as string) ?? null,
    };
  } catch (err) {
    // 23505 = unique_violation → email already taken.
    if (typeof err === "object" && err && "code" in err && err.code === "23505") {
      return null;
    }
    throw err;
  }
}

/**
 * Validate an email/password pair. Returns the user on success, `null`
 * otherwise. Always runs a bcrypt compare (even when the email is unknown,
 * against a dummy hash) so response time doesn't leak whether an account
 * exists.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AppUser | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, email, name, password_hash
    FROM users WHERE lower(email) = ${normalizeEmail(email)} LIMIT 1`;

  const hash =
    rows.length > 0
      ? (rows[0].password_hash as string)
      : "$2b$12$0000000000000000000000000000000000000000000000000000a";
  const ok = await bcrypt.compare(password, hash);
  if (!ok || rows.length === 0) return null;

  return {
    id: rows[0].id as string,
    email: rows[0].email as string,
    name: (rows[0].name as string) ?? null,
  };
}
