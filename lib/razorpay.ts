import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay via raw REST + HMAC — no SDK dependency (consistent with the rest of
 * the app, and keeps the webhook signature check fully transparent).
 */

const API = "https://api.razorpay.com/v1";

/** Subscriptions need the API key pair AND a pre-created Pro plan id. */
export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_PLAN_ID,
  );
}

/**
 * Master switch for the whole subscriptions/billing flow. Off by default so
 * the Pro upgrade stays paused until Razorpay KYC is live under the business
 * account — flip it on by setting BILLING_ENABLED=true (plus the RAZORPAY_*
 * keys) in the host env. Guards the billing page and the order/verify routes.
 */
export function isBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === "true";
}

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export interface RazorpaySubscription {
  id: string;
  status: string;
  shortUrl: string | null;
}

/**
 * Create a Razorpay subscription for the Pro plan (recurring monthly). The plan
 * id fixes the amount and interval, so no amount is passed here. `total_count`
 * caps the number of billing cycles — 120 months (10 years) is our
 * "runs until cancelled" horizon. Server-side only.
 */
export async function createSubscription(input: {
  planId: string;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscription> {
  const res = await fetch(`${API}/subscriptions`, {
    method: "POST",
    headers: { authorization: authHeader(), "content-type": "application/json" },
    body: JSON.stringify({
      plan_id: input.planId,
      total_count: 120,
      customer_notify: 1,
      notes: input.notes ?? {},
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Razorpay subscription failed: ${res.status} ${await res.text()}`,
    );
  }
  const data = (await res.json()) as {
    id: string;
    status: string;
    short_url?: string;
  };
  return { id: data.id, status: data.status, shortUrl: data.short_url ?? null };
}

/**
 * Verify a subscription checkout. For subscriptions Razorpay signs
 * HMAC-SHA256(payment_id + "|" + subscription_id) with KEY_SECRET — note the
 * order is the REVERSE of the one-time Orders flow. Timing-safe. This proves
 * the first payment is real before granting Pro; recurring charges thereafter
 * are confirmed via verifyWebhookSignature on subscription.charged events.
 */
export function verifySubscriptionSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Verify a webhook came from Razorpay: HMAC-SHA256 of the RAW request body
 * with the webhook secret must equal the x-razorpay-signature header.
 * (Kept for the optional subscription/reconciliation webhook.)
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
