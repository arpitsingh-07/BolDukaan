import { NextResponse } from "next/server";
import { storefrontSchema } from "@/lib/storefront";
import { isDbConfigured } from "@/lib/db";
import {
  publishNewStorefront,
  updateStorefrontByToken,
} from "@/lib/shops";

export const runtime = "nodejs";

interface PublishRequest {
  storefront?: unknown;
  transcript?: unknown;
  slug?: unknown;
  editToken?: unknown;
}

export async function POST(request: Request) {
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

  try {
    // Update path: only succeeds if the slug+token pair matches a row.
    if (slug && token) {
      const ok = await updateStorefrontByToken({
        slug,
        token,
        storefront,
        transcript,
      });
      if (!ok) {
        return NextResponse.json(
          { error: "This storefront can't be edited with that link." },
          { status: 403 },
        );
      }
      return NextResponse.json({ slug, editToken: token, updated: true });
    }

    // Create path.
    const result = await publishNewStorefront({ storefront, transcript });
    return NextResponse.json({ ...result, updated: false });
  } catch (err) {
    console.error("[/api/publish] failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your storefront. Try again in a moment." },
      { status: 500 },
    );
  }
}
