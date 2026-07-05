import { NextResponse } from "next/server";
import { z } from "zod";
import { isDbConfigured } from "@/lib/db";
import { createUser, isValidEmail } from "@/lib/users";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/auth/register — create an email/password account. On success the
 * client immediately signs in via the NextAuth Credentials provider; this
 * route only creates the row (it never issues a session itself).
 */
const bodySchema = z.object({
  email: z.string().min(3).max(200),
  password: z.string().min(8).max(200),
  name: z.string().max(80).optional(),
  // Accepting the Terms & Privacy Policy is required to create an account,
  // and enforced here so a tampered client can't skip it.
  agreedToTerms: z.literal(true),
});

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // Registration is unauthenticated by nature — throttle by IP to blunt
  // scripted account creation.
  if (!rateLimit(`register:${clientIp(request)}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts — wait a moment." },
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
    const agreeIssue = parsed.error.issues.some((i) =>
      i.path.includes("agreedToTerms"),
    );
    return NextResponse.json(
      {
        error: agreeIssue
          ? "Please accept the Terms and Privacy Policy to create an account."
          : "Enter a valid email and a password of at least 8 characters.",
      },
      { status: 400 },
    );
  }
  if (!isValidEmail(parsed.data.email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    const user = await createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name ?? null,
    });
    if (!user) {
      return NextResponse.json(
        { error: "That email is already registered — sign in instead." },
        { status: 409 },
      );
    }
    // Never return the hash or any secret — the client only needs "ok".
    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    console.error("[/api/auth/register] failed:", err);
    return NextResponse.json(
      { error: "Couldn't create your account. Try again." },
      { status: 500 },
    );
  }
}
