import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy/video?url=...&referer=...
 *
 * Server-side HLS proxy that:
 * 1. Attaches proper referer/origin headers that CDNs require
 * 2. Bypasses browser CORS restrictions on m3u8/ts files
 * 3. Rewrites .m3u8 segment URIs to route through this proxy
 */

// Allowed upstream CDN hostnames — add new ones as needed
const ALLOWED_HOSTS = new Set([
  "allanime.day",
  "allanime.to",
  "cdn.allanime.day",
  "wp.allimages.workers.dev",
  "v.vrv.co",
  "akamai.net",
  "cloudfront.net",
  "fastly.net",
  "bunnycdn.com",
  "b-cdn.net",
  "storage.googleapis.com",
  "googlevideo.com",
  "stream.moe",
  // Fallback providers
  "dood.re",
  "voe.sx",
  "filemoon.sx",
  "streamwish.to",
  "streamtape.com",
  "mixdrop.ag",
  "megastream.cc",
]);

function isAllowed(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl);
    // Allow exact match or subdomain match
    return ALLOWED_HOSTS.has(hostname) ||
      [...ALLOWED_HOSTS].some((h) => hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function rewriteM3U8(content: string, sourceUrl: string, proxyBase: string): string {
  const base = new URL(sourceUrl);
  const proxyUrl = (u: string) =>
    `${proxyBase}?url=${encodeURIComponent(u)}&referer=${encodeURIComponent(sourceUrl)}`;

  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      // URI= attribute in #EXT-X-KEY, #EXT-X-MAP etc.
      if (trimmed.startsWith("#") && trimmed.includes("URI=")) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          const abs = toAbsolute(uri, base);
          return `URI="${proxyUrl(abs)}"`;
        });
      }

      // Blank line or comment — pass through
      if (!trimmed || trimmed.startsWith("#")) return line;

      // Segment URI line
      const abs = toAbsolute(trimmed, base);
      return proxyUrl(abs);
    })
    .join("\n");
}

function toAbsolute(uri: string, base: URL): string {
  if (uri.startsWith("http")) return uri;
  if (uri.startsWith("//")) return `${base.protocol}${uri}`;
  if (uri.startsWith("/")) return `${base.protocol}//${base.host}${uri}`;
  return `${base.protocol}//${base.host}${base.pathname.replace(/\/[^/]*$/, "/")}${uri}`;
}

export async function GET(req: NextRequest) {
  const url     = req.nextUrl.searchParams.get("url");
  const referer = req.nextUrl.searchParams.get("referer") ?? "https://allanime.to/";

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }
  if (!isAllowed(url)) {
    return new NextResponse("Upstream host not in allowlist", { status: 403 });
  }

  let refererOrigin = "https://allanime.to";
  try { refererOrigin = new URL(referer).origin; } catch {}

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Referer:          referer,
        Origin:           refererOrigin,
        "Accept":         "*/*",
        "Accept-Language":"en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: 502 });
    }

    const ct = upstream.headers.get("content-type") ?? "";
    const isM3U8 =
      url.includes(".m3u8") ||
      ct.includes("mpegurl") ||
      ct.includes("x-mpegURL");

    const corsHeaders = new Headers({
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Headers": "*",
    });

    if (isM3U8) {
      const text = await upstream.text();
      const proxyBase = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/proxy/video`;
      const rewritten = rewriteM3U8(text, url, proxyBase);
      corsHeaders.set("Content-Type", "application/vnd.apple.mpegurl");
      corsHeaders.set("Cache-Control", "no-cache, no-store");
      return new NextResponse(rewritten, { headers: corsHeaders });
    }

    // Binary passthrough (TS segments, MP4, etc.)
    corsHeaders.set("Content-Type", ct || "application/octet-stream");
    corsHeaders.set(
      "Cache-Control",
      url.includes(".ts") ? "public, max-age=3600" : "no-cache"
    );
    return new NextResponse(upstream.body, { headers: corsHeaders });
  } catch (err) {
    console.error("[video-proxy] Fetch failed:", err);
    return new NextResponse("Failed to fetch upstream resource", { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
