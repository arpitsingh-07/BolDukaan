// Manually grant (or revoke) Pro for an account — a comp/admin tool, no payment.
// Runs locally against DATABASE_URL; never exposed to the web.
//
//   npm run grant-pro -- someone@email.com          # grant by email (email/password user)
//   npm run grant-pro -- their-shop-slug            # grant by a shop the person owns
//   npm run grant-pro -- <owner_user_id>            # grant by raw owner id (e.g. Google sub)
//   npm run grant-pro -- someone@email.com --revoke # take Pro away again
//
// Pro access is gated on plan='pro' AND status='active' (see lib/subscriptions.ts),
// so this simply upserts that row. current_period_end is set a year out for
// bookkeeping only — it is not enforced.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run via: npm run grant-pro -- <email|slug|owner_id>");
  process.exit(1);
}

const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const identifier = args.find((a) => !a.startsWith("--"));

if (!identifier) {
  console.error("Usage: npm run grant-pro -- <email | shop-slug | owner_user_id> [--revoke]");
  process.exit(1);
}

const sql = neon(url);

// Resolve the identifier to an owner_user_id.
async function resolveOwnerId(id) {
  if (id.includes("@")) {
    const rows = await sql`SELECT id FROM users WHERE lower(email) = ${id.toLowerCase()} LIMIT 1`;
    if (rows.length === 0) {
      throw new Error(
        `No email/password account for "${id}". If they signed in with Google, ` +
          `pass a shop slug they own or their owner_user_id instead ` +
          `(find it with: SELECT owner_user_id FROM shops WHERE slug='their-slug').`,
      );
    }
    return rows[0].id;
  }
  // Maybe it's a shop slug — resolve to that shop's owner.
  const shop = await sql`SELECT owner_user_id FROM shops WHERE slug = ${id} LIMIT 1`;
  if (shop.length > 0 && shop[0].owner_user_id) return shop[0].owner_user_id;
  // Otherwise treat it as a raw owner_user_id.
  return id;
}

try {
  const ownerId = await resolveOwnerId(identifier);

  const before = await sql`SELECT plan, status FROM subscriptions WHERE owner_user_id = ${ownerId} LIMIT 1`;
  console.log(`owner_user_id: ${ownerId}`);
  console.log(`before:        ${before.length ? `${before[0].plan}/${before[0].status}` : "(no subscription row)"}`);

  if (revoke) {
    await sql`
      UPDATE subscriptions
      SET plan = 'free', status = 'cancelled', updated_at = now()
      WHERE owner_user_id = ${ownerId}`;
    console.log("after:         free/cancelled  — Pro revoked");
  } else {
    await sql`
      INSERT INTO subscriptions (owner_user_id, provider, provider_sub_id, plan, status, current_period_end)
      VALUES (${ownerId}, 'manual', 'manual-grant', 'pro', 'active', now() + interval '1 year')
      ON CONFLICT (owner_user_id) DO UPDATE
        SET plan = 'pro', status = 'active', provider = 'manual',
            provider_sub_id = 'manual-grant',
            current_period_end = now() + interval '1 year', updated_at = now()`;
    console.log("after:         pro/active  — Pro granted");
  }
} catch (err) {
  console.error("\nFailed:", err.message ?? err);
  process.exit(1);
}
