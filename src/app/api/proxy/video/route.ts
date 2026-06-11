import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy/video?url=...&referer=...
 *
 * Proxies HLS manifests and segments to bypass CORS restrictions on
 * streaming CDNs. Rewrites .m3u8 segment paths to route through this proxy.
 */

const ALLOWED_HOSTS = [
  "aniwatch.to",
  "hianime.to",
  "megacloud.tv",
  "rapid-cloud.co",
  "rabbitstream.net",
  "s3.bunnycdn.ru",
  "akamai.net",
  "cloudfront.net",
  "akamaihd.net",
  "storage.googleapis.com",
];

function isAllowedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_HOSTS.some((h) => host.endsWith(h));
  } catch {
    return false;
  }
}

function rewriteM3U8(content: string, originalUrl: string, proxyBase: string): string {
  const baseUrl = new URL(originalUrl);
  const lines = content.split("\n");

  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;

      // It's a URI line — rewrite to proxy
      let absoluteUrl: string;
      if (trimmed.startsWith("http")) {
        absoluteUrl = trimmed;
      } else if (trimmed.startsWith("/")) {
        absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${trimmed}`;
      } else {
        absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${baseUrl.pathname.replace(/[^/]*$/, "")}${trimmed}`;
      }

      return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(baseUrl.href)}`;
    })
    .join("\n");
}

export async function GET(req: NextRequest) {
  const url     = req.nextUrl.searchParams.get("url");
  const referer = req.nextUrl.searchParams.get("referer") ?? "https://hianime.to/";

  if (!url) {
    return new NextResponse("url parameter required", { status: 400 });
  }

  if (!isAllowedHost(url)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: referer,
        Origin: new URL(referer).origin,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    const isM3U8 = url.includes(".m3u8") || contentType.includes("mpegurl");

    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": isM3U8 ? "no-cache" : "public, max-age=3600",
      "Content-Type": isM3U8 ? "application/vnd.apple.mpegurl" : contentType,
    });

    if (isM3U8) {
      const text = await upstream.text();
      const proxyBase = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/proxy/video`;
      const rewritten = rewriteM3U8(text, url, proxyBase);
      return new NextResponse(rewritten, { headers });
    }

    // For segments and other binary content, stream through
    return new NextResponse(upstream.body, { headers });
  } catch (err) {
    console.error("[video-proxy]", err);
    return new NextResponse("Failed to fetch stream", { status: 502 });
  }
}
