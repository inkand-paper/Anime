import { NextRequest, NextResponse } from "next/server";
import {
  searchAniList,
  getTrending,
  getPopular,
  getTopRated,
  getRecentlyAired,
  getByGenre,
  normalizeAnime,
} from "@/lib/anilist";

// GET /api/anime/search
// ?q=naruto           — search by title
// ?type=trending      — trending
// ?type=popular       — all-time popular
// ?type=top           — top rated
// ?type=recent        — currently airing
// ?genre=Action       — by genre
// ?page=1&perPage=20

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q       = searchParams.get("q") ?? "";
  const type    = searchParams.get("type") ?? "";
  const genre   = searchParams.get("genre") ?? "";
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("perPage") ?? "20", 10)));

  try {
    let result;

    if (q.trim()) {
      result = await searchAniList(q.trim(), page, perPage);
    } else if (genre) {
      result = await getByGenre(genre, page, perPage);
    } else {
      switch (type) {
        case "popular": result = await getPopular(page, perPage); break;
        case "top":     result = await getTopRated(page, perPage); break;
        case "recent":  result = await getRecentlyAired(page, perPage); break;
        default:        result = await getTrending(page, perPage); break;
      }
    }

    return NextResponse.json({
      results: result.media.filter((m) => !m.isAdult).map(normalizeAnime),
      pageInfo: result.pageInfo,
    });
  } catch (err) {
    console.error("[anime/search]", err);
    return NextResponse.json({ error: "Failed to fetch anime", results: [] }, { status: 500 });
  }
}
