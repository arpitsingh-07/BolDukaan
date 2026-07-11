import { getSql } from "./db";
import type { Plan } from "./plans";

export interface Subscription {
  plan: Plan;
  status: string;
  providerSubId: string | null;
  currentPeriodEnd: string | null;
}

export async function getSubscriptionForOwner(
  ownerUserId: string,
): Promise<Subscription | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT plan, status, provider_sub_id, current_period_end
    FROM subscriptions WHERE owner_user_id = ${ownerUserId} LIMIT 1`;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    plan: (r.plan as Plan) ?? "free",
    status: r.status as string,
    providerSubId: (r.provider_sub_id as string) ?? null,
    currentPeriodEnd: r.current_period_end ? String(r.current_period_end) : null,
  };
}

/** Pro access requires plan=pro AND an active status (billing is source of truth). */
export function isPro(sub: Subscription | null): boolean {
  return (
    !!sub &&
    sub.plan === "pro" &&
    (sub.status === "active" || sub.status === "authenticated")
  );
}

export async function planForOwner(ownerUserId: string): Promise<Plan> {
  return isPro(await getSubscriptionForOwner(ownerUserId)) ? "pro" : "free";
}

/** Record a newly-created (not-yet-paid) subscription attempt. */
export async function recordPendingSubscription(input: {
  ownerUserId: string;
  providerSubId: string;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO subscriptions (owner_user_id, provider, provider_sub_id, plan, status)
    VALUES (${input.ownerUserId}, 'razorpay', ${input.providerSubId}, 'pro', 'created')
    ON CONFLICT (owner_user_id) DO UPDATE
      SET provider_sub_id = EXCLUDED.provider_sub_id, plan = 'pro',
          status = 'created', updated_at = now()`;
}

/**
 * Grant Pro after a verified subscription checkout. Succeeds only if a pending
 * row for this owner AND this subscription exists (written when the
 * subscription was created) — so a valid signature can't upgrade an account
 * that didn't subscribe. provider_sub_id stays the subscription id so later
 * webhook events (charged / halted / cancelled) can find and update this row.
 */
export async function activateProBySubscription(input: {
  ownerUserId: string;
  subscriptionId: string;
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE subscriptions
    SET plan = 'pro', status = 'active', updated_at = now()
    WHERE owner_user_id = ${input.ownerUserId}
      AND provider_sub_id = ${input.subscriptionId}
    RETURNING owner_user_id`;
  return rows.length > 0;
}

/**
 * Apply a verified webhook event, keyed by the Razorpay subscription id.
 * Only `status` (and the period end) change — `plan` stays what the user
 * subscribed to; access is always gated on plan AND status (see isPro), so a
 * halted/cancelled sub loses Pro without rewriting its plan history.
 */
export async function applySubscriptionEvent(input: {
  providerSubId: string;
  status: string;
  currentPeriodEnd: Date | null;
}): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE subscriptions
    SET status = ${input.status},
        current_period_end = ${input.currentPeriodEnd
          ? input.currentPeriodEnd.toISOString()
          : null},
        updated_at = now()
    WHERE provider_sub_id = ${input.providerSubId}`;
}
