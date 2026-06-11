/**
 * AniWatch / HiAnime Streaming API
 *
 * AniWatch.to (formerly Zoro.to / HiAnime.to) is the largest free anime
 * streaming site. The aniwatch-api is an open-source REST wrapper:
 * https://github.com/ghoshRitesh12/aniwatch-api
 *
 * Self-host on Railway (free tier) for production:
 *   railway.app → new project → deploy from GitHub → ghoshRitesh12/aniwatch-api
 *
 * Set ANIWATCH_API_URL in .env.local.
 * Public fallback: https://aniwatch-api-production-4b7e.up.railway.app
 *
 * This gives us:
 *  - 10,000+ anime titles
 *  - Sub + Dub streams
 *  - HLS (.m3u8) sources that actually play in the browser
 *  - No DMCA issues on our side (we proxy the public API)
 */

const BASE =
  process.env.ANIWATCH_API_URL ??
  "https://aniwatch-api-production-4b7e.up.railway.app";

const TIMEOUT = 12_000;

async function apiFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // cache 5 min
    });
    if (!res.ok) throw new Error(`AniWatch API ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AWAnime {
  id: string;        // "attack-on-titan-112"
  name: string;
  jname: string;
  poster: string;
  duration: string;
  type: string;
  rating: string;
  episodes: { sub: number; dub: number };
}

export interface AWEpisode {
  title: string;
  episodeId: string; // "attack-on-titan-112?ep=1234"
  number: number;
  isFiller: boolean;
}

export interface AWStreamSource {
  url: string;
  isM3U8: boolean;
  type: string;
  quality?: string;
}

export interface AWStreamTrack {
  file: string;
  kind: string;
  label?: string;
  default?: boolean;
}

export interface AWEpisodeSources {
  headers: Record<string, string>;
  sources: AWStreamSource[];
  tracks: AWStreamTrack[];
  anilistID: number | null;
  malID: number | null;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function awSearch(q: string): Promise<AWAnime[]> {
  const data = await apiFetch<{ animes: AWAnime[] }>(
    `/api/v2/hianime/search?q=${encodeURIComponent(q)}&page=1`
  );
  return data.animes ?? [];
}

// ─── Episodes list ────────────────────────────────────────────────────────────

export async function awGetEpisodes(aniwatchId: string): Promise<AWEpisode[]> {
  const data = await apiFetch<{ episodes: AWEpisode[] }>(
    `/api/v2/hianime/anime/${encodeURIComponent(aniwatchId)}/episodes`
  );
  return data.episodes ?? [];
}

// ─── Episode sources ──────────────────────────────────────────────────────────

export async function awGetSources(
  episodeId: string,
  server: "hd-1" | "hd-2" | "hd-3" = "hd-1",
  category: "sub" | "dub" = "sub"
): Promise<AWEpisodeSources | null> {
  try {
    return await apiFetch<AWEpisodeSources>(
      `/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(episodeId)}&server=${server}&category=${category}`
    );
  } catch {
    return null;
  }
}

// ─── Match AniList ID → AniWatch ID ──────────────────────────────────────────
// AniWatch uses slug IDs like "attack-on-titan-112".
// We search by the romaji title and find the best slug match.

export async function findAniwatchId(
  malId: number | null,
  romajiTitle: string
): Promise<string | null> {
  // 1. Try searching by title
  const results = await awSearch(romajiTitle).catch(() => []);
  if (results.length > 0) {
    // Best match: exact name or closest
    const exact = results.find(
      (r) => r.name.toLowerCase() === romajiTitle.toLowerCase()
    );
    return exact?.id ?? results[0].id;
  }

  // 2. Fallback: try slug built from MAL ID
  if (malId) {
    const cleaned = romajiTitle
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");
    return `${cleaned}-${malId}`;
  }

  return null;
}
