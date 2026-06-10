import { NextRequest, NextResponse } from "next/server";
import { resolveVideoSources } from "@/lib/video-resolver";

/**
 * GET /api/anime/[id]/episode/[ep]
 *
 * Returns the resolved video sources for a given anime + episode number.
 * Resolution order: dubbed DB mappings → Gogoanime → Zoro
 *
 * The client (VideoPlayer / watch page) calls this instead of
 * talking to Consumet directly — keeps external API URL server-side only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ep: string }> }
) {
  const { id, ep } = await params;
  const episode = parseInt(ep, 10);

  if (isNaN(episode) || episode < 1) {
    return NextResponse.json({ error: "Invalid episode number" }, { status: 400 });
  }

  const sources = await resolveVideoSources(decodeURIComponent(id), episode);

  if (sources.length === 0) {
    return NextResponse.json(
      { error: "No sources found for this episode", sources: [] },
      { status: 404 }
    );
  }

  return NextResponse.json({ sources });
}
