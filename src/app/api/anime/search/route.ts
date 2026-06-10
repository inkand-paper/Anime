import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/consumet";

// GET /api/anime/search?q=naruto&provider=gogoanime
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const provider = (req.nextUrl.searchParams.get("provider") ?? "gogoanime") as "gogoanime" | "zoro";

  if (!q?.trim()) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const results = await searchAnime(q, provider);
  return NextResponse.json({ results });
}
