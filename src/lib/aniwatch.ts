/**
 * Streaming embed provider client
 *
 * Uses MAL ID (from AniList's idMal field) to build iframe embed URLs
 * from multiple reliable providers. These load in the browser directly —
 * no server-side stream extraction needed, no API keys, no rate limits.
 *
 * Providers used:
 *  1. VidSrc.me  — largest free embed library, MAL ID support
 *  2. VidSrc.to  — alternative instance
 *  3. 2embed.cc  — another reliable MAL-ID-based provider
 *  4. AnimePahe  — HLS via Kwik (handled separately in animepahe.ts)
 */

export interface AWAnime {
  id: string;
  name: string;
  jname: string;
  poster: string;
  duration: string;
  type: string;
  rating: string;
  episodes: { sub: number; dub: number };
}

export interface AWEpisode {
  title: string | null;
  episodeId: string;
  number: number;
  isFiller: boolean;
}

export interface AWStreamSource {
  url: string;
  isM3U8: boolean;
  type: string;
  quality?: string;
}

export interface AWEpisodeSources {
  headers: Record<string, string>;
  sources: AWStreamSource[];
  tracks: { file: string; kind: string; label?: string; default?: boolean }[];
  anilistID: number | null;
  malID: number | null;
}

/**
 * Build iframe embed URLs for a given MAL ID and episode number.
 * These are ordered by reliability — player tries them in order.
 */
export function buildEmbedSources(
  malId: number,
  episode: number
): { label: string; url: string; priority: number }[] {
  return [
    {
      label: "VidSrc",
      url: `https://vidsrc.me/embed/anime?mal=${malId}&episode=${episode}`,
      priority: 10,
    },
    {
      label: "VidSrc.to",
      url: `https://vidsrc.to/embed/anime/${malId}/${episode}`,
      priority: 20,
    },
    {
      label: "2Embed",
      url: `https://2embed.cc/embed/anime?mal=${malId}&ep=${episode}`,
      priority: 30,
    },
    {
      label: "VidSrc.in",
      url: `https://vidsrc.in/embed/anime/mal-${malId}/${episode}`,
      priority: 40,
    },
  ];
}

/**
 * Stub functions kept for API compatibility with video-resolver.ts.
 * HiAnime API is no longer used — replaced by embed providers.
 */
export async function awSearch(_q: string): Promise<AWAnime[]> { return []; }
export async function awGetEpisodes(_id: string): Promise<AWEpisode[]> { return []; }
export async function awGetSources(_epId: string, _server: string, _cat: string): Promise<AWEpisodeSources | null> { return null; }
export async function findAniwatchId(_malId: number | null, _title: string): Promise<string | null> { return null; }
