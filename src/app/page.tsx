import { Suspense } from "react";
import {
  getTrending,
  getPopular,
  getTopRated,
  getRecentlyAired,
  normalizeAnime,
} from "@/lib/anilist";
import Hero from "@/components/Hero";
import AnimeGrid from "@/components/AnimeGrid";
import AdBanner from "@/components/AdBanner";
import { Anime } from "@/data/anime";
import { Loader2 } from "lucide-react";

export const revalidate = 600; // Revalidate every 10 minutes

async function fetchSections() {
  const [trendingRes, popularRes, topRes, recentRes] = await Promise.allSettled([
    getTrending(1, 24),
    getPopular(1, 24),
    getTopRated(1, 24),
    getRecentlyAired(1, 24),
  ]);

  const toAnimes = (r: PromiseSettledResult<{ media: Parameters<typeof normalizeAnime>[0][] }>) =>
    r.status === "fulfilled"
      ? (r.value.media.map(normalizeAnime) as Anime[])
      : [];

  return {
    trending: toAnimes(trendingRes),
    popular:  toAnimes(popularRes),
    topRated: toAnimes(topRes),
    recent:   toAnimes(recentRes),
  };
}

export default async function HomePage() {
  const { trending, popular, topRated, recent } = await fetchSections();

  const hero = trending[0] ?? popular[0] ?? null;

  if (!hero) {
    return (
      <div className="min-h-dvh flex items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Connecting to AniList...
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Hero banner (top section, full bleed) */}
      <Hero anime={hero} />

      {/* Content rows — overlap the bottom of the hero */}
      <div className="relative z-10 pb-20" style={{ marginTop: "-5rem" }}>

        {trending.length > 0 && (
          <Suspense>
            <AnimeGrid
              title="Trending Now"
              icon="trending"
              animes={trending}
              viewAllHref="/browse?type=trending"
            />
          </Suspense>
        )}

        <div className="container mx-auto px-4 sm:px-6 py-2">
          <AdBanner slot="home-mid" />
        </div>

        {recent.length > 0 && (
          <Suspense>
            <AnimeGrid
              title="Currently Airing"
              icon="tv"
              animes={recent}
              viewAllHref="/browse?type=recent"
            />
          </Suspense>
        )}

        {popular.length > 0 && (
          <Suspense>
            <AnimeGrid
              title="All-Time Popular"
              icon="flame"
              animes={popular}
              viewAllHref="/browse?type=popular"
            />
          </Suspense>
        )}

        {topRated.length > 0 && (
          <Suspense>
            <AnimeGrid
              title="Top Rated"
              icon="star"
              animes={topRated}
              viewAllHref="/browse?type=top"
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
