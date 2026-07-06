import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDbConfigured } from "@/lib/db";
import { deleteAccount } from "@/lib/users";

export const runtime = "nodejs";

/**
 * DELETE /api/account — self-serve account + data deletion (DPDP-friendly).
 * Identity comes from the server session only; deletes exactly the caller's
 * own shops, subscription, and account. The client signs out afterwards.
 */
export async function DELETE() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }
  const session = await auth();
  const ownerUserId = session?.user?.id;
  if (!ownerUserId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  try {
    await deleteAccount(ownerUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/account] delete failed:", err);
    return NextResponse.json({ error: "Couldn't delete. Try again." }, { status: 500 });
  }
}
