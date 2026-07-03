import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { razorpayConfigured, createSubscription } from "@/lib/razorpay";
import {
  recordPendingSubscription,
  getSubscriptionForOwner,
  isPro,
} from "@/lib/subscriptions";

export const runtime = "nodejs";

/** Start a Pro subscription for the signed-in user; returns ids for Checkout. */
export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Billing isn't configured yet. Set the RAZORPAY_* env vars." },
      { status: 503 },
    );
  }

  const session = await auth();
  const ownerUserId = session?.user?.id;
  if (!ownerUserId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Don't clobber an active Pro subscription with a fresh 'created' row.
  const existing = await getSubscriptionForOwner(ownerUserId).catch(() => null);
  if (isPro(existing)) {
    return NextResponse.json(
      { error: "You're already on Pro." },
      { status: 400 },
    );
  }

  try {
    const sub = await createSubscription({ owner_user_id: ownerUserId });
    await recordPendingSubscription({ ownerUserId, providerSubId: sub.id });
    return NextResponse.json({
      subscriptionId: sub.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[/api/billing/subscribe] failed:", err);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 502 });
  }
}
