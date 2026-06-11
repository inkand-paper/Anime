import { NextRequest, NextResponse } from "next/server";
import { getAnimeById } from "@/lib/anilist";
import { resolveVideoSources } from "@/lib/video-resolver";

// GET /api/anime/[id]/episode/[ep]
// id = AniList numeric ID, ep = episode number
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ep: string }> }
) {
  const { id, ep } = await params;
  const episode = parseInt(ep, 10);

  if (isNaN(episode) || episode < 1) {
    return NextResponse.json({ error: "Invalid episode number" }, { status: 400 });
  }

  // Fetch anime metadata to get romaji title and MAL ID for AniWatch matching
  let romajiTitle: string | undefined;
  let malId: number | null = null;

  try {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      const anime = await getAnimeById(numericId);
      if (anime) {
        romajiTitle = anime.title.romaji;
        malId = anime.idMal;
      }
    }
  } catch {
    // non-fatal — resolver will fall back to slug matching
  }

  const sources = await resolveVideoSources(id, episode, romajiTitle, malId);

  if (sources.length === 0) {
    return NextResponse.json(
      { error: "No stream sources found for this episode.", sources: [] },
      { status: 404 }
    );
  }

  return NextResponse.json({ sources });
}
