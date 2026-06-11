import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const ADMIN_PATHS = ["/admin", "/api/admin"];
const AUTH_PATHS  = ["/profile", "/watchlist"];
const AUTH_SKIP   = ["/login", "/signup", "/api/auth"];

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname.startsWith(p));
}

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const ip = getIp(req);

  // --- CORS preflight ---
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Webhook-Secret",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // --- Auth-required routes ---
  if (isPath(pathname, AUTH_PATHS) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // --- Admin-only routes ---
  if (isPath(pathname, ADMIN_PATHS)) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // @ts-expect-error custom session field
    if (session.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // --- Redirect authed users away from auth pages ---
  if (session && isPath(pathname, AUTH_SKIP)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // --- Security: block suspicious user agents ---
  const ua = req.headers.get("user-agent") ?? "";
  if (/sqlmap|nikto|nmap|masscan|curl\/7\.[0-3]/i.test(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const res = NextResponse.next();

  // --- Attach common security headers (belt + suspenders) ---
  res.headers.set("X-Request-ID", crypto.randomUUID());
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");

  void ip; // IP available for rate-limit integration in API routes
  return res;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
