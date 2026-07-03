import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay via raw REST + HMAC — no SDK dependency (consistent with the rest of
 * the app, and keeps the webhook signature check fully transparent).
 */

const API = "https://api.razorpay.com/v1";

export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_PLAN_ID,
  );
}

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

/** Create a Razorpay subscription for the Pro plan. Returns the subscription id. */
export async function createSubscription(
  notes: Record<string, string>,
): Promise<{ id: string }> {
  const res = await fetch(`${API}/subscriptions`, {
    method: "POST",
    headers: { authorization: authHeader(), "content-type": "application/json" },
    body: JSON.stringify({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      total_count: 12, // 12 billing cycles
      customer_notify: 1,
      notes,
    }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay create failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { id: string };
}

/**
 * Verify a webhook came from Razorpay: HMAC-SHA256 of the RAW request body
 * with the webhook secret must equal the x-razorpay-signature header.
 * Timing-safe comparison. Never trust a billing event without this.
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
