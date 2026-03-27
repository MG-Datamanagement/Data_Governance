/**
 * middleware.ts — Next.js Route Protection
 *
 * Guards all /(modules) routes so unauthenticated users are redirected to /login.
 * Uses next-auth's built-in JWT session cookie (`next-auth.session-token`) as the
 * auth signal so no server round-trip is needed for every navigation.
 *
 * HOW TO ACTIVATE:
 *  1. Install next-auth: `npm install next-auth`
 *  2. Set NEXTAUTH_SECRET in .env.local
 *  3. Create src/app/api/auth/[...nextauth]/route.ts with your provider config
 *  4. Uncomment the next-auth import block below and remove the dev bypass
 *
 * Until next-auth is fully wired, the middleware is in "dev bypass" mode — it
 * still runs on every matched route and sets a security header, but does NOT
 * redirect, so local development is unaffected.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Route config ─────────────────────────────────────────────────────────────
// Matches all routes under /(modules) — protects the entire authenticated shell.
// Public routes (/login, /register, /api/auth/**, static assets) are excluded.
export const config = {
  matcher: [
    "/((?!login|register|_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};

// ─── Auth cookie names (next-auth defaults) ───────────────────────────────────
const SESSION_COOKIE = "next-auth.session-token";
const SECURE_SESSION_COOKIE = "__Secure-next-auth.session-token";

function hasValidSession(request: NextRequest): boolean {
  return (
    request.cookies.has(SESSION_COOKIE) ||
    request.cookies.has(SECURE_SESSION_COOKIE)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Dev bypass ──────────────────────────────────────────────────────────────
  // Remove this block once next-auth is fully configured.
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const response = NextResponse.next();
    // Still inject security headers even in dev
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }
  // ── End dev bypass ──────────────────────────────────────────────────────────

  // ── Production auth check ───────────────────────────────────────────────────
  if (!hasValidSession(request)) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the original destination so the login page can redirect back
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated: add security headers ────────────────────────────────────
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}
