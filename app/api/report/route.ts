import { NextResponse } from "next/server";
import { z } from "zod";
import { isDbConfigured } from "@/lib/db";
import { recordShopReport } from "@/lib/shops";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/report — a visitor flags a shop (fake, illegal, wrong info).
 * Public + unauthenticated, so rate-limited and length-bounded. Reviewed by
 * the Grievance Officer named in the Terms.
 */
const bodySchema = z.object({
  slug: z.string().min(1).max(200),
  reason: z.string().trim().min(3).max(1000),
});

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }
  if (!rateLimit(`report:${clientIp(request)}`, 6, 60_000)) {
    return NextResponse.json(
      { error: "Too many reports — wait a moment." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tell us what's wrong." }, { status: 400 });
  }

  try {
    await recordShopReport({ slug: parsed.data.slug, reason: parsed.data.reason });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/report] failed:", err);
    return NextResponse.json({ error: "Couldn't send. Try again." }, { status: 500 });
  }
}
