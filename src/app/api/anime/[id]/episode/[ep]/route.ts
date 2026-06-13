import { NextRequest, NextResponse } from "next/server";
import { getAnimeById } from "@/lib/anilist";
import { resolveVideoSources } from "@/lib/video-resolver";

/**
 * GET /api/anime/[id]/episode/[ep]
 *
 * id  = AniList numeric ID (e.g. 21)
 * ep  = episode number (e.g. 1)
 *
 * Returns { sources: VideoSource[] } sorted by priority.
 * AllAnime and AnimePahe are queried in parallel.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ep: string }> }
) {
  const { id, ep } = await params;
  const episode = parseInt(ep, 10);

  if (isNaN(episode) || episode < 1) {
    return NextResponse.json(
      { error: "Invalid episode number", sources: [] },
      { status: 400 }
    );
  }

  // Fetch AniList metadata to get all title variants for better matching
  const titleVariants: string[] = [];
  let malId: number | null = null;

  try {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      const anime = await getAnimeById(numericId);
      if (anime) {
        malId = anime.idMal;
        // Add all non-null title variants — more options = better API matching
        const t = anime.title;
        if (t.romaji)  titleVariants.push(t.romaji);
        if (t.english) titleVariants.push(t.english);
        if (t.native)  titleVariants.push(t.native);
      }
    }
  } catch (e) {
    console.warn(`[episode-route] AniList lookup failed for id=${id}:`, e);
  }

  // Deduplicate while preserving order
  const titles = Array.from(new Set(titleVariants.filter(Boolean)));

  if (titles.length === 0) {
    return NextResponse.json(
      { error: "Could not find anime metadata", sources: [] },
      { status: 404 }
    );
  }

  const sources = await resolveVideoSources(id, episode, titles, malId);

  if (sources.length === 0) {
    return NextResponse.json(
      {
        error: `No stream found for episode ${episode}. ` +
               `Tried AllAnime + AnimePahe with titles: ${titles.join(", ")}`,
        sources: [],
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ sources });
}
