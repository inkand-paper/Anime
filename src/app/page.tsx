// Server component — fetches anime from DB + Real-time Scraper
import { prisma } from "@/lib/prisma";
import { getRecentEpisodes } from "@/lib/consumet";
import Hero from "@/components/Hero";
import AnimeGrid from "@/components/AnimeGrid";
import AdBanner from "@/components/AdBanner";

// Map DB Anime row to the shape expected by components
function mapAnime(a: any) {
  return {
    id: a.id,
    title: {
      English: a.titleEn || a.title,
      Japanese: a.titleJp || a.title,
      Chinese:  a.titleCn || a.title,
    },
    description: a.description ?? "",
    image:       a.image       ?? "/placeholder.jpg",
    banner:      a.banner      ?? a.image ?? "/placeholder.jpg",
    year:        a.year        ?? "—",
    rating:      String(a.rating ?? "N/A"),
    episodes:    a.totalEpisodes ?? a.episodes ?? 0,
    tags:        Array.isArray(a.tags) ? a.tags : (a.tags ? a.tags.split(",").map((t: string) => t.trim()) : []),
  };
}

export default async function Home() {
  // 1. Fetch Featured/Dubbed from local DB
  const dbAnime = await prisma.anime.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // 2. Fetch VAST amounts from Real-Time API (Internal Scraper)
  const [recent1, recent2] = await Promise.all([
    getRecentEpisodes(1),
    getRecentEpisodes(2),
  ]);

  const recentReleases = [...recent1, ...recent2].map(mapAnime);
  const manualFeatured = dbAnime.map(mapAnime);

  // Blend them
  const trending = [...manualFeatured, ...recentReleases.slice(0, 10)];
  const featured = manualFeatured[0] || recentReleases[0];

  if (!featured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-zinc-500 gap-4">
        <div className="w-12 h-12 bg-white/5 rounded-full animate-pulse" />
        <p className="text-sm font-black uppercase tracking-[0.4em]">Establishing Nexus...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-black">
      {/* Hero */}
      <Hero anime={featured} />

      {/* Content grid - overlaps hero slightly for cinematic feel */}
      <div className="lg:-mt-24 relative z-20 space-y-12 pb-32">
        <AnimeGrid title="Global Sub Releases" animes={recentReleases.slice(0, 12)} />
        
        <div className="container mx-auto px-6">
          <AdBanner slot="home-mid" />
        </div>

        {manualFeatured.length > 0 && (
          <AnimeGrid title="Native Dubbed Selection" animes={manualFeatured} />
        )}

        <AnimeGrid title="Recently Discovered" animes={recentReleases.slice(12, 24)} />
      </div>
    </div>
  );
}
