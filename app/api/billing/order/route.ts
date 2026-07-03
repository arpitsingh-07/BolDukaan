import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { razorpayConfigured, createOrder } from "@/lib/razorpay";
import {
  recordPendingSubscription,
  getSubscriptionForOwner,
  isPro,
} from "@/lib/subscriptions";
import { PRO_PRICE_PAISE } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Create a Razorpay order for the Pro upgrade and return the ids the browser
 * needs to open Standard Checkout. Records a pending row keyed by the order id
 * so /verify can only activate the account that actually ordered.
 */
export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Billing isn't configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
      { status: 503 },
    );
  }

  const session = await auth();
  const ownerUserId = session?.user?.id;
  if (!ownerUserId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const existing = await getSubscriptionForOwner(ownerUserId).catch(() => null);
  if (isPro(existing)) {
    return NextResponse.json({ error: "You're already on Pro." }, { status: 400 });
  }

  const amount = PRO_PRICE_PAISE;
  if (amount < 100) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  try {
    const order = await createOrder({
      amount,
      receipt: `pro-${Date.now()}`,
      notes: { owner_user_id: ownerUserId },
    });
    await recordPendingSubscription({ ownerUserId, providerSubId: order.id });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // key_id is public — safe to send to the browser. KEY_SECRET never leaves the server.
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[/api/billing/order] failed:", err);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 500 });
  }
}
