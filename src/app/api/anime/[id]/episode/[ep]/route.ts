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

  // Define an array of potential title formats to maximize search matching success
  let titles: string[] = [];
  let malId: number | null = null;

  try {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      const anime = await getAnimeById(numericId);
      if (anime && anime.title) {
        malId = anime.idMal;
        
        // Add title variants sequentially based on lookup reliability
        if (anime.title.romaji) titles.push(anime.title.romaji);
        if (anime.title.english) titles.push(anime.title.english);
        if (anime.title.userPreferred) titles.push(anime.title.userPreferred);
      }
    }
  } catch (err) {
    console.error("[ROUTE DEBUG] Non-fatal: Failed to pre-fetch AniList metadata maps:", err);
  }

  console.log(`[ROUTE DEBUG] Initializing resolveVideoSources for AniList ID: ${id}, Ep: ${episode}`);
  console.log(`[ROUTE DEBUG] Candidate titles to attempt:`, titles);

  const sources = await resolveVideoSources(id, episode, titles, malId);

  console.log(`[ROUTE DEBUG] resolveVideoSources completed. Total stream nodes found: ${sources.length}`);

  if (sources.length === 0) {
    console.warn(`[ROUTE DEBUG] Returning 404! No stream providers could resolve links for ID: ${id} (Ep ${episode})`);
    return NextResponse.json(
      { error: "No stream sources found for this episode.", sources: [] },
      { status: 404 }
    );
  }

  return NextResponse.json({ sources });
}