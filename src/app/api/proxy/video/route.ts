import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy/video?url=...&referer=...
 *
 * Server-side HLS/TS proxy:
 * - Attaches the correct Referer + Origin headers CDNs require
 * - Bypasses browser CORS restrictions on m3u8 / ts segments
 * - Rewrites .m3u8 segment + key URIs to route through this same proxy
 */

// Allowlisted CDN / streaming hostnames (subdomain-aware)
const ALLOWED_HOSTS: readonly string[] = [
  // AllAnime
  "allanime.day",
  "allanime.to",
  "cdn.allanime.day",
  "wp.allimages.workers.dev",
  "repackager.wixmp.com",
  // AnimePahe / Kwik
  "kwik.si",
  "kwik.cx",
  "kwik.pw",
  "animepahe.ru",
  "animepahe.com",
  "animepahe.org",
  "llss.me",
  // Major CDNs
  "akamai.net",
  "akamaihd.net",
  "cloudfront.net",
  "fastly.net",
  "bunnycdn.com",
  "b-cdn.net",
  "storage.googleapis.com",
  "googlevideo.com",
  // Gogoanime mirrors
  "gogoanime.hu",
  "gogoanime.vc",
  "anitaku.to",
  "anineko.to",
  // Dubbed host embeds
  "dood.re", "dood.la", "dood.cx",
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
    return ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
}

function getRefererOrigin(referer: string): string {
  try { return new URL(referer).origin; } catch { return "https://animepahe.ru"; }
}

/** Rewrite all URIs inside an m3u8 playlist to go through this proxy */
function rewriteM3U8(content: string, sourceUrl: string, proxyBase: string): string {
  const base = new URL(sourceUrl);

  const proxied = (uri: string) => {
    let abs: string;
    if (uri.startsWith("http")) {
      abs = uri;
    } else if (uri.startsWith("//")) {
      abs = `${base.protocol}${uri}`;
    } else if (uri.startsWith("/")) {
      abs = `${base.protocol}//${base.host}${uri}`;
    } else {
      abs = `${base.protocol}//${base.host}${base.pathname.replace(/\/[^/]*$/, "/")}${uri}`;
    }
    return `${proxyBase}?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(sourceUrl)}`;
  };

  return content
    .split("\n")
    .map((line) => {
      const t = line.trim();
      // Rewrite URI="..." attributes (EXT-X-KEY, EXT-X-MAP, etc.)
      if (t.startsWith("#") && t.includes('URI="')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${proxied(uri)}"`);
      }
      // Blank line or other comment — pass through
      if (!t || t.startsWith("#")) return line;
      // Segment / child playlist URI line
      return proxied(t);
    })
    .join("\n");
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url     = req.nextUrl.searchParams.get("url") ?? "";
  const referer = req.nextUrl.searchParams.get("referer") ?? "https://animepahe.ru/";

  if (!url) return new NextResponse("Missing url parameter", { status: 400 });
  if (!isAllowed(url)) {
    console.warn("[proxy] Blocked:", url);
    return new NextResponse("Host not in allowlist", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Referer: referer,
        Origin: getRefererOrigin(referer),
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(25_000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: 502 });
    }

    const ct = upstream.headers.get("content-type") ?? "";
    const isM3U8 =
      url.includes(".m3u8") ||
      ct.includes("mpegurl") ||
      ct.includes("x-mpegURL");

    const cors: HeadersInit = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    };

    if (isM3U8) {
      const text = await upstream.text();
      const base = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/proxy/video`;
      const out  = rewriteM3U8(text, url, base);
      return new NextResponse(out, {
        headers: {
          ...cors,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-cache, no-store",
        },
      });
    }

    // TS segments, MP4, key files etc. — stream through
    return new NextResponse(upstream.body, {
      headers: {
        ...cors,
        "Content-Type": ct || "application/octet-stream",
        "Cache-Control": url.endsWith(".ts") ? "public, max-age=3600" : "no-cache",
      },
    });
  } catch (err) {
    console.error("[proxy] Error:", err);
    return new NextResponse("Proxy fetch failed", { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}
