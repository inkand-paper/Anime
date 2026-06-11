import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

const ADMIN_PATHS = ["/admin", "/api/admin"];
const PROTECTED_PATHS = ["/profile", "/watchlist"];
const AUTH_SKIP = ["/login", "/signup", "/api/auth"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await auth();

  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Webhook-Secret",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 2. Suspicious UA Blocking
  const ua = req.headers.get("user-agent") ?? "";
  if (/sqlmap|nikto|nmap|masscan|curl\/7\.[0-3]/i.test(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3. Auth Protection & Redirection
  const isProtectedPath = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));
  const isAuthSkipPath = AUTH_SKIP.some(p => pathname.startsWith(p));

  if ((isProtectedPath || isAdminPath) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminPath && session) {
    // @ts-expect-error custom session field
    if (session.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (isAuthSkipPath && session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Response & Security Headers
  const response = NextResponse.next();
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    connect-src 'self' https:;
    frame-src 'self' https:;
    media-src 'self' blob: data: https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

  // response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  // response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer-when-downgrade");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-Request-ID", crypto.randomUUID());

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
