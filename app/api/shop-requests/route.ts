import { NextResponse } from "next/server";
import { z } from "zod";
import { isDbConfigured } from "@/lib/db";
import { recordShopRequest } from "@/lib/shops";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/shop-requests — a consumer naming a shop they want to see online
 * (from the empty "shops near you" state). Feeds the ground team's target
 * list. Public + unauthenticated, so it's rate-limited and length-bounded.
 */
const bodySchema = z.object({
  query: z.string().trim().min(2).max(120),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
});

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }
  if (!rateLimit(`shopreq:${clientIp(request)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — wait a moment." },
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
    return NextResponse.json({ error: "Enter a shop name or number." }, { status: 400 });
  }

  try {
    await recordShopRequest({
      query: parsed.data.query,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/shop-requests] failed:", err);
    return NextResponse.json({ error: "Couldn't save. Try again." }, { status: 500 });
  }
}
