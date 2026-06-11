/**
 * Canonical Anime type used throughout the frontend.
 * Data is fetched live from AniList API — no mock data.
 */
export interface Anime {
  id: string;           // AniList numeric ID as string
  malId: string | null;
  title: {
    English: string;
    Japanese: string;
    Chinese: string;    // AniList has no ZH title — mapped to Romaji
    Romaji: string;
  };
  image: string;
  banner: string;
  rating: string;       // e.g. "8.7"
  year: string;
  episodes: number;
  description: string;
  tags: string[];       // genre names
  status: string;
  studios: string[];
  format: string;
  color: string;        // dominant cover color from AniList
}

// No mock data — all content comes from AniList + AniWatch APIs.
export const MOCK_ANIME: Anime[] = [];
