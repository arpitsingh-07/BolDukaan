import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay via raw REST + HMAC — no SDK dependency (consistent with the rest of
 * the app, and keeps the webhook signature check fully transparent).
 */

const API = "https://api.razorpay.com/v1";

/** Standard Checkout (orders) needs only the API key pair — no plan id. */
export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
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

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

/** Create a Razorpay order (amount in paise, ≥ 100). Server-side only. */
export async function createOrder(input: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { authorization: authHeader(), "content-type": "application/json" },
    body: JSON.stringify({
      amount: input.amount,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as RazorpayOrder;
  return { id: data.id, amount: data.amount, currency: data.currency };
}

/**
 * Verify a Standard Checkout payment: HMAC-SHA256(order_id + "|" + payment_id)
 * with KEY_SECRET must equal the razorpay_signature returned to the browser.
 * Timing-safe. This is what proves a payment is real before granting Pro.
 * (Distinct from verifyWebhookSignature, which signs the raw body with the
 * webhook secret.)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
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
