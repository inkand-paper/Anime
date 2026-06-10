import { NextRequest, NextResponse } from "next/server";
import { getAnimeInfo } from "@/lib/consumet";

// GET /api/anime/[id]?provider=gogoanime
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const provider = (req.nextUrl.searchParams.get("provider") ?? "gogoanime") as "gogoanime" | "zoro";

  const info = await getAnimeInfo(decodeURIComponent(id), provider);
  if (!info) {
    return NextResponse.json({ error: "Anime not found" }, { status: 404 });
  }

  return NextResponse.json(info);
}
