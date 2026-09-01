import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// HTTP Basic Auth gate for /admin and all /api/admin/* routes.
// Runs at the Vercel Edge before any page or API handler executes —
// there is no way to bypass this by disabling JS or hitting routes directly.
//
// Set these env vars in Vercel dashboard (Settings → Environment Variables):
//   ADMIN_USERNAME   — the username you'll type into the browser dialog
//   ADMIN_PASSWORD   — a strong password (16+ random chars recommended)
//
// In development, set them in .env.local.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect the admin dashboard and all admin API routes.
  const isAdminPath =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin");

  if (!isAdminPath) return NextResponse.next();

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    // Env vars not set — block access entirely rather than exposing data.
    return new NextResponse("Admin credentials not configured.", { status: 503 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const isBasic    = authHeader.toLowerCase().startsWith("basic ");

  if (isBasic) {
    const base64      = authHeader.slice(6);
    const decoded     = atob(base64);
    const colonIdx    = decoded.indexOf(":");
    const sentUser    = colonIdx === -1 ? decoded : decoded.slice(0, colonIdx);
    const sentPass    = colonIdx === -1 ? ""       : decoded.slice(colonIdx + 1);

    // Constant-time comparison to prevent timing attacks.
    const userMatch = timingSafeEqual(sentUser, username);
    const passMatch = timingSafeEqual(sentPass, password);

    if (userMatch && passMatch) {
      return NextResponse.next();
    }
  }

  // Credentials missing or wrong — prompt the browser to show its auth dialog.
  return new NextResponse("Unauthorised", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="Braxton Works Admin", charset="UTF-8"`,
    },
  });
}

// Poor-man's constant-time string compare (avoids early-exit leaking length info).
// Real crypto.subtle.timingSafeEqual operates on buffers — this is good enough
// for an admin password check where the strings are short and ASCII.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to avoid timing leak on length difference.
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) ?? 0) ^ (b.charCodeAt(i) ?? 0);
    return false; // length mismatch is always false, regardless of content
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
