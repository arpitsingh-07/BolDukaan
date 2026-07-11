import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { verifySubscriptionSignature, isBillingEnabled } from "@/lib/razorpay";
import { activateProBySubscription } from "@/lib/subscriptions";

export const runtime = "nodejs";

interface VerifyBody {
  razorpay_payment_id?: unknown;
  razorpay_subscription_id?: unknown;
  razorpay_signature?: unknown;
}

/**
 * Verify a subscription checkout and grant Pro. The signature is the sole proof
 * that the first payment is real — a mismatch returns 400 and grants nothing.
 * Recurring renewals are handled separately by the Razorpay webhook.
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: "Subscriptions are paused right now." },
      { status: 503 },
    );
  }

  const session = await auth();
  const ownerUserId = session?.user?.id;
  if (!ownerUserId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const paymentId = body.razorpay_payment_id;
  const subscriptionId = body.razorpay_subscription_id;
  const signature = body.razorpay_signature;
  if (
    typeof paymentId !== "string" ||
    typeof subscriptionId !== "string" ||
    typeof signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
  }

  // Signature mismatch → do NOT mark as paid.
  if (!verifySubscriptionSignature(paymentId, subscriptionId, signature)) {
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 400 },
    );
  }

  const activated = await activateProBySubscription({
    ownerUserId,
    subscriptionId,
  });
  if (!activated) {
    // Valid signature, but no matching pending subscription for this account.
    return NextResponse.json(
      { error: "Subscription not found for this account." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, plan: "pro" });
}
