import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { activateProByOrder } from "@/lib/subscriptions";

export const runtime = "nodejs";

interface VerifyBody {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
}

/**
 * Verify a Standard Checkout payment and grant Pro. The signature is the sole
 * proof of payment — a mismatch returns 400 and grants nothing.
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
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

  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  if (
    typeof orderId !== "string" ||
    typeof paymentId !== "string" ||
    typeof signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
  }

  // Signature mismatch → do NOT mark as paid.
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 400 },
    );
  }

  const activated = await activateProByOrder({ ownerUserId, orderId, paymentId });
  if (!activated) {
    // Valid signature, but no matching pending order for this account.
    return NextResponse.json(
      { error: "Order not found for this account." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, plan: "pro" });
}
