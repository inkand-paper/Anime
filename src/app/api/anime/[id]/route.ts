import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnimeInfo } from "@/lib/consumet";

// Map DB Anime row to the shape expected by components
function mapAnime(a: any) {
  return {
    id: a.id,
    title: {
      English:  a.titleEn,
      Japanese: a.titleJp ?? a.titleEn,
      Chinese:  a.titleCn ?? a.titleEn,
    },
    description: a.description ?? "",
    image:       a.image       ?? "/placeholder.jpg",
    banner:      a.banner      ?? "/placeholder.jpg",
    year:        a.year        ?? "—",
    rating:      String(a.rating ?? "N/A"),
    episodes:    a.episodes ?? 0,
    tags:        a.tags ? a.tags.split(",").map((t: string) => t.trim()) : [],
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  try {
    // 1. Try Database first
    const dbAnime = await prisma.anime.findUnique({
      where: { id: decodedId }
    });

    if (dbAnime) {
      return NextResponse.json(mapAnime(dbAnime));
    }

    // 2. Fallback to Consumet
    const provider = (req.nextUrl.searchParams.get("provider") ?? "gogoanime") as "gogoanime" | "zoro";
    const info = await getAnimeInfo(decodedId, provider);

    if (!info) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    // Map Consumet format roughly to our UI format
    const c = info as any;
    return NextResponse.json({
      id: c.id,
      title: {
        English:  c.title,
        Japanese: c.title, 
        Chinese:  c.title,
      },
      description: c.description || "",
      image:       c.image,
      banner:      c.cover || c.image,
      year:        c.releaseDate || "—",
      rating:      String(c.rating || "N/A"),
      episodes:    c.totalEpisodes || 0,
      tags:        c.genres || [],
    });

  } catch (error) {
    console.error("Fetch anime error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
