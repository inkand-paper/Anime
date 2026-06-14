/**
 * HiAnime / AniWatch Streaming API Client
 *
 * Uses the open-source aniwatch-api:
 *   https://github.com/ghoshRitesh12/aniwatch-api
 *
 * Self-host for free on Railway:
 *   1. railway.app → New Project → Deploy from GitHub
 *   2. Repo: ghoshRitesh12/aniwatch-api
 *   3. Set ANIWATCH_API_URL in .env.local to your Railway URL
 *
 * This replaces AllAnime which now blocks server-side requests (403).
 * HiAnime has 10,000+ titles, sub + dub, HLS streams.
 */

const BASE =
  process.env.ANIWATCH_API_URL?.replace(/\/$/, "") ??
  "https://aniwatch-api-production-4b7e.up.railway.app";

const TIMEOUT = 15_000;

async function hiGet<T>(path: string, cache = 300): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AniStream/1.0",
    },
    signal: AbortSignal.timeout(TIMEOUT),
    next: { revalidate: cache },
  });
  if (!res.ok) throw new Error(`HiAnime API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AWAnime {
  id: string;        // e.g. "jujutsu-kaisen-418"
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
  episodeId: string;   // e.g. "jujutsu-kaisen-418?ep=2503"
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

// ─── Search ───────────────────────────────────────────────────────────────────

export async function awSearch(q: string): Promise<AWAnime[]> {
  try {
    const data = await hiGet<{ animes: AWAnime[] }>(
      `/api/v2/hianime/search?q=${encodeURIComponent(q)}&page=1`,
      60
    );
    return data.animes ?? [];
  } catch (e) {
    console.warn("[hianime] Search failed:", e);
    return [];
  }
}

// ─── Episode list ─────────────────────────────────────────────────────────────

export async function awGetEpisodes(animeId: string): Promise<AWEpisode[]> {
  try {
    const data = await hiGet<{ episodes: AWEpisode[] }>(
      `/api/v2/hianime/anime/${encodeURIComponent(animeId)}/episodes`
    );
    return data.episodes ?? [];
  } catch (e) {
    console.warn("[hianime] Episode list failed:", e);
    return [];
  }
}

// ─── Episode sources ──────────────────────────────────────────────────────────

export async function awGetSources(
  episodeId: string,
  server: "hd-1" | "hd-2" | "hd-3" = "hd-1",
  category: "sub" | "dub" = "sub"
): Promise<AWEpisodeSources | null> {
  try {
    return await hiGet<AWEpisodeSources>(
      `/api/v2/hianime/episode/sources` +
        `?animeEpisodeId=${encodeURIComponent(episodeId)}` +
        `&server=${server}&category=${category}`,
      60
    );
  } catch (e) {
    console.warn(`[hianime] Sources failed (${server}/${category}):`, e);
    return null;
  }
}

// ─── Find HiAnime show ID by title ───────────────────────────────────────────

export async function findAniwatchId(
  _malId: number | null,
  title: string
): Promise<string | null> {
  const results = await awSearch(title);
  if (!results.length) return null;

  const q = title.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

  // 1. Exact match
  const exact = results.find(
    (r) => r.name.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim() === q
  );
  if (exact) return exact.id;

  // 2. Contains match (title is substring of result or vice versa)
  const contains = results.find(
    (r) =>
      r.name.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(r.name.toLowerCase())
  );
  if (contains) return contains.id;

  // 3. First result as last resort
  return results[0].id;
}
