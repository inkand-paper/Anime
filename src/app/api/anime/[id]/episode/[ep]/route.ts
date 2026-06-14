import { NextRequest, NextResponse } from "next/server";
import { getAnimeById } from "@/lib/anilist";
import { resolveVideoSources } from "@/lib/video-resolver";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ep: string }> }
) {
  const { id, ep } = await params;
  const episode = parseInt(ep, 10);

  if (isNaN(episode) || episode < 1) {
    return NextResponse.json({ error: "Invalid episode number", sources: [] }, { status: 400 });
  }

  // Get all title variants from AniList for better API matching
  const titles: string[] = [];
  let malId: number | null = null;

  try {
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      const anime = await getAnimeById(numId);
      if (anime) {
        malId = anime.idMal;
        if (anime.title.romaji)  titles.push(anime.title.romaji);
        if (anime.title.english) titles.push(anime.title.english);
        // Don't add native (Japanese) — breaks Latin-script search APIs
      }
    }
  } catch (e) {
    console.warn(`[episode-route] AniList lookup failed for id=${id}:`, e);
  }

  if (!titles.length) {
    return NextResponse.json(
      { error: "Could not resolve anime titles from AniList", sources: [] },
      { status: 404 }
    );
  }

  console.log(`[episode-route] Resolving: AniList=${id}, Ep=${episode}, Titles: ${titles.join(" | ")}`);

  const sources = await resolveVideoSources(id, episode, titles, malId);

  if (!sources.length) {
    return NextResponse.json(
      {
        error: `No stream found. Tried HiAnime + AnimePahe with: ${titles.join(", ")}`,
        hint: "Make sure ANIWATCH_API_URL is set in .env.local. Self-host aniwatch-api on Railway (free).",
        sources: [],
      },
      { status: 404 }
    );
  }

  console.log(`[episode-route] Found ${sources.length} sources: ${sources.map(s => s.label).join(", ")}`);
  return NextResponse.json({ sources });
}
