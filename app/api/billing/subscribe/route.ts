import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import {
  razorpayConfigured,
  isBillingEnabled,
  createSubscription,
} from "@/lib/razorpay";
import {
  recordPendingSubscription,
  getSubscriptionForOwner,
  isPro,
} from "@/lib/subscriptions";

export const runtime = "nodejs";

/**
 * Create a Razorpay subscription for the Pro upgrade and return the id the
 * browser needs to open Checkout. Records a pending row keyed by the
 * subscription id so /verify can only activate the account that subscribed.
 */
export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: "Subscriptions are paused right now." },
      { status: 503 },
    );
  }
  if (!razorpayConfigured()) {
    return NextResponse.json(
      {
        error:
          "Billing isn't configured yet. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_PLAN_ID.",
      },
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

  try {
    const subscription = await createSubscription({
      planId: process.env.RAZORPAY_PLAN_ID as string,
      notes: { owner_user_id: ownerUserId },
    });
    await recordPendingSubscription({
      ownerUserId,
      providerSubId: subscription.id,
    });
    return NextResponse.json({
      subscriptionId: subscription.id,
      // key_id is public — safe to send to the browser. KEY_SECRET never leaves the server.
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[/api/billing/subscribe] failed:", err);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 500 });
  }
}
