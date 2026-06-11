export interface Anime {
  id: string;
  title: {
    English: string;
    Japanese: string;
    Chinese: string;
  };
  image: string;
  banner: string;
  rating: string;
  year: string;
  episodes: number;
  description: string;
  tags: string[];
}

// This file is kept for TypeScript type exports only.
// Actual anime data is fetched live from the scraper (AniNeko.to)
// and from the database (seeded with real slugs in prisma/seed.ts).
// No hardcoded mock anime — everything is dynamic.
export const MOCK_ANIME: Anime[] = [];
