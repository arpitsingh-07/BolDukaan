import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { storefrontSchema } from "@/lib/storefront";
import { isDbConfigured } from "@/lib/db";
import {
  publishNewStorefront,
  updateStorefrontByToken,
  updateStorefrontByOwner,
  listShopsByOwner,
} from "@/lib/shops";
import { planForOwner } from "@/lib/subscriptions";
import { FREE_STOREFRONT_LIMIT, PRO_STOREFRONT_LIMIT } from "@/lib/plans";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface PublishRequest {
  storefront?: unknown;
  transcript?: unknown;
  slug?: unknown;
  editToken?: unknown;
  lat?: unknown;
  lng?: unknown;
}

function parseLocation(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    return { lat, lng };
  }
  return null;
}

export async function POST(request: Request) {
  if (!rateLimit(`publish:${clientIp(request)}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — wait a minute and try again." },
      { status: 429 },
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        error:
          "Server is missing DATABASE_URL. Add your Neon connection string to .env.local and run `npm run db:init`.",
      },
      { status: 503 },
    );
  }

  let body: PublishRequest;
  try {
    body = (await request.json()) as PublishRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Never render or store unvalidated model output — re-validate on the server.
  const parsed = storefrontSchema.safeParse(body.storefront);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid storefront data." },
      { status: 400 },
    );
  }
  const storefront = parsed.data;
  const transcript =
    typeof body.transcript === "string" ? body.transcript : null;

  const slug = typeof body.slug === "string" ? body.slug : null;
  const token = typeof body.editToken === "string" ? body.editToken : null;
  const location = parseLocation(body.lat, body.lng);

  // Owner identity is derived from the server session ONLY — never the client.
  const session = await auth();
  const ownerUserId = session?.user?.id ?? null;

  try {
    // Update via edit token (anonymous ownership from M1).
    if (slug && token) {
      const ok = await updateStorefrontByToken({
        slug,
        token,
        storefront,
        transcript,
        location,
      });
      if (!ok) {
        return NextResponse.json(
          { error: "This storefront can't be edited with that link." },
          { status: 403 },
        );
      }
      return NextResponse.json({ slug, editToken: token, updated: true });
    }

    // Update via logged-in ownership (dashboard edit).
    if (slug && ownerUserId) {
      const ok = await updateStorefrontByOwner({
        slug,
        ownerUserId,
        storefront,
        transcript,
        location,
      });
      if (!ok) {
        return NextResponse.json(
          { error: "You don't have permission to edit this storefront." },
          { status: 403 },
        );
      }
      return NextResponse.json({ slug, updated: true });
    }

    // A slug with neither a valid token nor a session must not silently
    // create a duplicate shop.
    if (slug) {
      return NextResponse.json(
        { error: "Sign in (or use your edit link) to update this storefront." },
        { status: 401 },
      );
    }

    // Plan limits for signed-in owners (billing decides the plan).
    if (ownerUserId) {
      const [plan, existing] = await Promise.all([
        planForOwner(ownerUserId),
        listShopsByOwner(ownerUserId),
      ]);
      const limit =
        plan === "pro" ? PRO_STOREFRONT_LIMIT : FREE_STOREFRONT_LIMIT;
      if (existing.length >= limit) {
        return NextResponse.json(
          plan === "pro"
            ? { error: `Pro allows up to ${PRO_STOREFRONT_LIMIT} storefronts.` }
            : {
                error: `The free plan allows ${FREE_STOREFRONT_LIMIT} storefront. Upgrade to Pro to add more.`,
                upgrade: true,
              },
          { status: 402 },
        );
      }
    }

    // Create — attributes the shop to the logged-in owner when there is one.
    const result = await publishNewStorefront({
      storefront,
      transcript,
      ownerUserId,
      location,
    });
    return NextResponse.json({ ...result, updated: false });
  } catch (err) {
    console.error("[/api/publish] failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your storefront. Try again in a moment." },
      { status: 500 },
    );
  }
}
