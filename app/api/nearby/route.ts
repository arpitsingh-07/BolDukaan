import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { findNearbyShops } from "@/lib/shops";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 25;

/** GET /api/nearby?lat=&lng=&radius= — active shops near a point, nearest first. */
export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ shops: [], radiusKm: DEFAULT_RADIUS_KM });
  }
  if (!rateLimit(`nearby:${clientIp(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — wait a moment." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ error: "Invalid location." }, { status: 400 });
  }

  const requested = Number(searchParams.get("radius")) || DEFAULT_RADIUS_KM;
  const radiusKm = Math.min(Math.max(requested, 0.5), MAX_RADIUS_KM);

  try {
    const shops = await findNearbyShops({ lat, lng, radiusKm });
    return NextResponse.json({ shops, radiusKm });
  } catch (err) {
    console.error("[/api/nearby] failed:", err);
    return NextResponse.json(
      { error: "Couldn't load nearby shops." },
      { status: 500 },
    );
  }
}
