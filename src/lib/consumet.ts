/**
 * Consumet API client
 *
 * Consumet is a free, open-source anime streaming data API.
 * Self-host it: https://github.com/consumet/api.consumet.org
 * Or use the public instance (rate-limited, not for production):
 *   https://api.consumet.org
 *
 * Set CONSUMET_API_URL in .env.local to your own hosted instance.
 *
 * Providers used:
 *   - gogoanime  → primary (largest catalogue, dubbed + subbed)
 *   - zoro       → fallback (higher quality, mostly subbed)
 */

const BASE = process.env.CONSUMET_API_URL ?? "https://api.consumet.org";
const TIMEOUT_MS = 8000;

async function cfetch(path: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BASE}${path}`, { signal: controller.signal, next: { revalidate: 3600 } });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConsumetEpisode {
  id: string;         // e.g. "one-piece-episode-1"
  number: number;
  title?: string;
  description?: string;
  image?: string;
  url: string;
}

export interface ConsumetAnimeInfo {
  id: string;
  title: string;
  url: string;
  image: string;
  cover?: string;
  description?: string;
  releaseDate?: string;
  status?: string;
  genres?: string[];
  totalEpisodes?: number;
  episodes: ConsumetEpisode[];
}

export interface ConsumetStreamingLink {
  url: string;
  isM3U8: boolean;
  quality?: string;
}

export interface ConsumetEpisodeSources {
  headers?: Record<string, string>;
  sources: ConsumetStreamingLink[];
  download?: string;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAnime(
  query: string,
  provider: "gogoanime" | "zoro" = "gogoanime"
): Promise<ConsumetAnimeInfo[]> {
  try {
    const res = await cfetch(`/anime/${provider}/${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

// ─── Anime info + episode list ────────────────────────────────────────────────

export async function getAnimeInfo(
  animeId: string,
  provider: "gogoanime" | "zoro" = "gogoanime"
): Promise<ConsumetAnimeInfo | null> {
  try {
    const res = await cfetch(`/anime/${provider}/info?id=${encodeURIComponent(animeId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Episode streaming sources ────────────────────────────────────────────────

export async function getEpisodeSources(
  episodeId: string,
  provider: "gogoanime" | "zoro" = "gogoanime",
  server: "gogocdn" | "vidstreaming" | "streamsb" | "vidcloud" = "gogocdn"
): Promise<ConsumetEpisodeSources | null> {
  try {
    const res = await cfetch(
      `/anime/${provider}/watch?episodeId=${encodeURIComponent(episodeId)}&server=${server}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Recent episodes ──────────────────────────────────────────────────────────

export async function getRecentEpisodes(
  provider: "gogoanime" | "zoro" = "gogoanime",
  page = 1
): Promise<ConsumetAnimeInfo[]> {
  try {
    const res = await cfetch(`/anime/${provider}/recent-episodes?page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}
