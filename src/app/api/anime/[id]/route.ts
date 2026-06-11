import { NextRequest, NextResponse } from "next/server";
import { getAnimeById, normalizeAnime } from "@/lib/anilist";

// GET /api/anime/[id]  — id is the AniList integer ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid anime ID" }, { status: 400 });
  }

  const anime = await getAnimeById(numericId);
  if (!anime) {
    return NextResponse.json({ error: "Anime not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeAnime(anime));
}
