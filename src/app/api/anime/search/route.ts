import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/consumet";

// GET /api/anime/search?q=naruto&provider=gogoanime
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const provider = (req.nextUrl.searchParams.get("provider") ?? "gogoanime") as "gogoanime" | "zoro";

  if (!q?.trim()) {
    const { getRecentEpisodes } = await import("@/lib/consumet");
    const results = await getRecentEpisodes(1);
    return NextResponse.json({ results });
  }

  const results = await searchAnime(q, provider);
  return NextResponse.json({ results });
}
