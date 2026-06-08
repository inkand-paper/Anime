import Hero from "@/components/Hero";
import AnimeGrid from "@/components/AnimeGrid";
import { MOCK_ANIME } from "@/data/anime";

export default function Home() {
  const featuredAnime = MOCK_ANIME[0];
  const trendingAnime = MOCK_ANIME.slice(0, 6);
  const recommendations = [...MOCK_ANIME].reverse();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <Hero anime={featuredAnime} />

      {/* Main Content Sections */}
      <div className="lg:-mt-20 relative z-20 space-y-4">
        <AnimeGrid title="Trending Now" animes={trendingAnime} />
        <AnimeGrid title="Recommended For You" animes={recommendations} />
        <AnimeGrid title="Recently Added" animes={MOCK_ANIME.slice(3, 6)} />
      </div>

      {/* Footer Space */}
      <div className="py-20"></div>
    </div>
  );
}
