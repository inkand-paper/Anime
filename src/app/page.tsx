import { Suspense } from "react";
import { getTrending, getPopular, getTopRated, getRecentlyAired, normalizeAnime } from "@/lib/anilist";
import Hero from "@/components/Hero";
import AnimeGrid from "@/components/AnimeGrid";
import AdBanner from "@/components/AdBanner";
import { Anime } from "@/data/anime";
import { TrendingUp, Flame, Star, Tv } from "lucide-react";

// Revalidate every 10 minutes
export const revalidate = 600;

async function fetchAllSections() {
  const [trending, popular, topRated, recent] = await Promise.allSettled([
    getTrending(1, 20),
    getPopular(1, 20),
    getTopRated(1, 20),
    getRecentlyAired(1, 20),
  ]);

  const safe = <T,>(r: PromiseSettledResult<T>, fallback: T) =>
    r.status === "fulfilled" ? r.value : fallback;

  const empty = { media: [], pageInfo: { total: 0, currentPage: 1, hasNextPage: false } };

  return {
    trending: safe(trending, empty).media.map(normalizeAnime) as Anime[],
    popular:  safe(popular,  empty).media.map(normalizeAnime) as Anime[],
    topRated: safe(topRated, empty).media.map(normalizeAnime) as Anime[],
    recent:   safe(recent,   empty).media.map(normalizeAnime) as Anime[],
  };
}

export default async function HomePage() {
  const { trending, popular, topRated, recent } = await fetchAllSections();

  const hero = trending[0] ?? popular[0];

  if (!hero) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          Loading content...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Hero anime={hero} />

      <div className="relative z-10 space-y-2 pb-20" style={{ marginTop: "-6rem" }}>
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

        <div className="container mx-auto px-4 sm:px-6">
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
