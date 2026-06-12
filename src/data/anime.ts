/**
 * Canonical Anime type — matches the output of normalizeAnime() in src/lib/anilist.ts.
 * All content is fetched live from AniList + AllAnime APIs. No static mock data.
 */
export interface Anime {
  id: string;        // AniList numeric ID as string
  malId: string | null;
  title: {
    English: string;
    Japanese: string;
    Chinese: string;  // Mapped to Romaji (AniList has no ZH field)
    Romaji: string;
  };
  image: string;     // Cover image URL (extraLarge)
  banner: string;    // Banner image URL (falls back to cover)
  rating: string;    // e.g. "8.7" — "N/A" if no score
  year: string;      // Season year or start year
  episodes: number;  // Total episode count (0 if unknown)
  description: string;
  tags: string[];    // Genre names from AniList
  status: string;    // RELEASING | FINISHED | NOT_YET_RELEASED | CANCELLED | HIATUS
  studios: string[]; // Main studio names
  format: string;    // TV | MOVIE | OVA | ONA | SPECIAL | MUSIC
  color: string;     // Dominant cover colour hex (e.g. "#3b82f6")
}

// All data is fetched from AniList API at runtime.
// This empty export exists so TypeScript is satisfied when other files import it.
export const MOCK_ANIME: Anime[] = [];
