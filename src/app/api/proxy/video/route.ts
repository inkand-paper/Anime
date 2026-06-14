import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy/video?url=...&referer=...
 *
 * Server-side HLS proxy that:
 * - Attaches the correct Referer/Origin headers CDNs require
 * - Bypasses browser CORS on .m3u8 / .ts / .key files
 * - Rewrites .m3u8 URIs so all segments also route through here
 */

const ALLOWED: readonly string[] = [
  // HiAnime / MegaCloud CDN (aniwatch-api streams)
  "megacloud.tv",
  "rapid-cloud.co",
  "rabbitstream.net",
  "megacloud.store",
  "hianime.to",
  "aniwatch.to",
  "s3.bunnycdn.ru",
  "delivery.fastly.net",
  // AnimePahe / Kwik
  "kwik.si", "kwik.cx", "kwik.pw",
  "animepahe.ru", "animepahe.com", "animepahe.org",
  "llss.me",
  // AllAnime (kept for potential future use)
  "allanime.day", "allanime.to", "cdn.allanime.day",
  // Generic CDNs
  "akamai.net", "akamaihd.net",
  "cloudfront.net",
  "fastly.net",
  "bunnycdn.com", "b-cdn.net",
  "storage.googleapis.com",
  "googlevideo.com",
  // Dubbed upload hosts
  "dood.re", "dood.la", "dood.cx", "dood.pm",
  "voe.sx",
  "filemoon.sx",
  "streamwish.to",
  "streamtape.com",
  "mixdrop.ag",
  "megastream.cc",
];

function isAllowed(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl);
    return ALLOWED.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function getOrigin(referer: string): string {
  try { return new URL(referer).origin; }
  catch { return "https://hianime.to"; }
}

function rewriteM3U8(text: string, sourceUrl: string, proxyBase: string): string {
  const base = new URL(sourceUrl);

  const toProxy = (uri: string): string => {
    let abs: string;
    if (uri.startsWith("http")) abs = uri;
    else if (uri.startsWith("//")) abs = `${base.protocol}${uri}`;
    else if (uri.startsWith("/")) abs = `${base.protocol}//${base.host}${uri}`;
    else abs = `${base.protocol}//${base.host}${base.pathname.replace(/\/[^/]*$/, "/")}${uri}`;
    return `${proxyBase}?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(sourceUrl)}`;
  };

  return text.split("\n").map((line) => {
    const t = line.trim();
    if (t.startsWith("#") && t.includes('URI="')) {
      return line.replace(/URI="([^"]+)"/g, (_, u) => `URI="${toProxy(u)}"`);
    }
    if (!t || t.startsWith("#")) return line;
    return toProxy(t);
  }).join("\n");
}

export async function GET(req: NextRequest) {
  const url     = req.nextUrl.searchParams.get("url") ?? "";
  const referer = req.nextUrl.searchParams.get("referer") ?? "https://hianime.to/";

  if (!url) return new NextResponse("Missing url", { status: 400 });
  if (!isAllowed(url)) {
    console.warn("[proxy] Blocked host:", new URL(url).hostname);
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Referer: referer,
        Origin: getOrigin(referer),
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(25_000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream ${upstream.status}`, { status: 502 });
    }

    const ct = upstream.headers.get("content-type") ?? "";
    const isM3U8 = url.includes(".m3u8") || ct.includes("mpegurl");

    const cors: HeadersInit = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    };

    if (isM3U8) {
      const text = await upstream.text();
      const base = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/proxy/video`;
      return new NextResponse(rewriteM3U8(text, url, base), {
        headers: { ...cors, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-cache" },
      });
    }

    return new NextResponse(upstream.body, {
      headers: { ...cors, "Content-Type": ct || "application/octet-stream", "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    console.error("[proxy]", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "*" },
  });
}
