import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { setShopStatus, setShopTheme, deleteShopByOwner } from "@/lib/shops";
import { planForOwner } from "@/lib/subscriptions";
import { THEMES, FREE_THEMES } from "@/lib/plans";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * PATCH — update a shop the caller owns.
 *   { status: "active" | "unpublished" }  → publish/unpublish
 *   { theme: "<theme id>" }               → change theme (Pro for non-classic)
 */
export async function PATCH(request: Request, { params }: Ctx) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const session = await auth();
  const ownerUserId = session?.user?.id;
  if (!ownerUserId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { slug } = await params;
  let body: { status?: unknown; theme?: unknown };
  try {
    body = (await request.json()) as { status?: unknown; theme?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  // Theme change
  if (typeof body.theme === "string") {
    const theme = body.theme;
    if (!THEMES.some((t) => t.id === theme)) {
      return NextResponse.json({ error: "Unknown theme." }, { status: 400 });
    }
    if (!FREE_THEMES.includes(theme)) {
      const plan = await planForOwner(ownerUserId);
      if (plan !== "pro") {
        return NextResponse.json(
          { error: "Premium themes require Pro.", upgrade: true },
          { status: 402 },
        );
      }
    }
    const ok = await setShopTheme({ slug, ownerUserId, theme });
    if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ slug, theme });
  }

  // Status change
  const status = body.status;
  if (status !== "active" && status !== "unpublished") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const ok = await setShopStatus({ slug, ownerUserId, status });
  if (!ok) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ slug, status });
}

/** DELETE — remove a shop the caller owns (storefront cascades). */
export async function DELETE(_request: Request, { params }: Ctx) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const session = await auth();
  const ownerUserId = session?.user?.id;
  if (!ownerUserId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { slug } = await params;
  const ok = await deleteShopByOwner(slug, ownerUserId);
  if (!ok) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ deleted: slug });
}
