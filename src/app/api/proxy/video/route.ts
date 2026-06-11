import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const referer = req.nextUrl.searchParams.get("referer") || "https://anitaku.to/";

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        "Referer": referer,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      responseType: "stream",
    });

    const headers = new Headers();
    headers.set("Content-Type", String(response.headers["content-type"] || "video/mp4"));
    headers.set("Cache-Control", "public, max-age=3600");
    headers.set("Access-Control-Allow-Origin", "*");

    // Pipe the stream
    return new NextResponse(response.data, {
      headers,
    });
  } catch (error: any) {
    console.error("[video-proxy] Fail:", error.message);
    return new NextResponse("Failed to fetch stream", { status: 502 });
  }
}
