import { NextResponse, type NextRequest } from "next/server";

/**
 * Pre-launch "Coming Soon" gate. While enabled, EVERY request is rewritten to
 * /coming-soon — the real app, routes and data stay intact behind it (nothing
 * is deleted). Reversible two ways:
 *   • Launch:  set env COMING_SOON=off  (or delete this file)
 *   • Preview: set env PREVIEW_KEY=<secret>, then visit  /?preview=<secret>
 *              once — a cookie then lets that browser see the real site.
 *
 * Fail-safe default: the gate is ON unless COMING_SOON is explicitly "off", so
 * a forgotten env var keeps the site private rather than accidentally live.
 */

const PREVIEW_COOKIE = "bd_preview";

export function middleware(req: NextRequest) {
  const enabled = (process.env.COMING_SOON ?? "on").toLowerCase() !== "off";
  if (!enabled) return NextResponse.next();

  const { pathname, searchParams } = req.nextUrl;
  const key = process.env.PREVIEW_KEY;

  // Unlock this browser with ?preview=<PREVIEW_KEY> — sets a cookie, then off you go.
  if (key && searchParams.get("preview") === key) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("preview");
    const res = NextResponse.redirect(url);
    res.cookies.set(PREVIEW_COOKIE, key, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }
  if (key && req.cookies.get(PREVIEW_COOKIE)?.value === key) {
    return NextResponse.next();
  }

  // The holding page itself must render normally (no rewrite loop).
  if (pathname === "/coming-soon") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/coming-soon";
  return NextResponse.rewrite(url);
}

export const config = {
  // Gate everything except Next internals and a few static assets the holding
  // page needs (the logo mark, icons, favicon).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo-mark.png|icon.png|apple-icon.png).*)",
  ],
};
