import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { applySubscriptionEvent } from "@/lib/subscriptions";
import { isDbConfigured } from "@/lib/db";

export const runtime = "nodejs";

interface RazorpayEvent {
  event?: string;
  payload?: {
    subscription?: {
      entity?: { id?: string; current_end?: number };
    };
  };
}

export async function POST(request: Request) {
  // The RAW body is required for signature verification — read it as text.
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(raw) as RazorpayEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.event ?? "";
  const entity = event.payload?.subscription?.entity;

  if (isDbConfigured() && entity?.id) {
    // Map Razorpay events to a status; plan is never rewritten by billing
    // events — isPro() requires plan='pro' AND status='active', so any
    // non-active status revokes Pro on its own.
    let status: string | null = null;

    if (
      type === "subscription.activated" ||
      type === "subscription.charged" ||
      type === "subscription.authenticated" ||
      type === "subscription.resumed"
    ) {
      status = "active";
    } else if (
      type === "subscription.halted" ||
      type === "subscription.pending" ||
      type === "subscription.paused"
    ) {
      status = "past_due";
    } else if (
      type === "subscription.cancelled" ||
      type === "subscription.completed" ||
      type === "subscription.expired"
    ) {
      status = "cancelled";
    }

    if (status) {
      const currentPeriodEnd = entity.current_end
        ? new Date(entity.current_end * 1000)
        : null;
      try {
        await applySubscriptionEvent({
          providerSubId: entity.id,
          status,
          currentPeriodEnd,
        });
      } catch (err) {
        console.error("[razorpay webhook] update failed:", err);
        // 500 → Razorpay retries the delivery.
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
    }
  }

  // Acknowledge everything else so Razorpay stops retrying.
  return NextResponse.json({ received: true });
}
