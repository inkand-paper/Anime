import { prisma } from "@/lib/prisma";
import { awGetEpisodes, awGetSources, findAniwatchId } from "@/lib/aniwatch";

export interface VideoSource {
  label: string;
  url: string;
  type: "iframe" | "hls" | "mp4";
  priority: number;
  dubbed: boolean;
  headers?: Record<string, string>;
  tracks?: { file: string; kind: string; label?: string; default?: boolean }[];
}

export const DUBBED_HOSTS = [
  "DOODSTREAM",
  "VOE",
  "FILEMOON",
  "STREAMWISH",
  "STREAMTAPE",
  "MIXDROP",
  "MEGASTREAM",
] as const;

export type DubbedHost = (typeof DUBBED_HOSTS)[number];

/**
 * Sanitizes and mutates known structural naming patterns that cause scrapers to fail.
 */
function sanitizeTitleForScraper(title: string): string {
  return title
    .replace(/2nd Season/gi, "Season 2")
    .replace(/3rd Season/gi, "Season 3")
    .replace(/4th Season/gi, "Season 4")
    .trim();
}

/**
 * Resolve video sources for a given AniList anime ID + episode number.
 */
export async function resolveVideoSources(
  anilistId: string,
  episode: number,
  titlesInput?: string | string[],
  malId?: number | null
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];

  // ── 1. Dubbed DB Mappings Lookup ─────────────────────────────────────────
  try {
    const mappings = await prisma.hostMapping.findMany({
      where: { animeId: anilistId, episode },
      orderBy: { host: "asc" },
    });
    
    mappings.forEach((m, i) => {
      sources.push({
        label: `${m.host.charAt(0) + m.host.slice(1).toLowerCase()} (DUB)`,
        url: m.embedUrl,
        type: (m.embedType as "iframe" | "hls" | "mp4") ?? "iframe",
        priority: i + 1,
        dubbed: true,
      });
    });
  } catch (e) {
    console.warn("[resolver] Local DB lookup failed or bypassed:", e);
  }

  // If local DB overrides exist, return early to optimize performance
  if (sources.length > 0) {
    return sources.sort((a, b) => a.priority - b.priority);
  }

  // ── 2. External Streaming Scraper Layer ─────────────────────────────────
  try {
    // Collect all query permutations into a sanitized string array
    const searchQueries: string[] = [];
    if (Array.isArray(titlesInput)) {
      titlesInput.forEach(t => {
        searchQueries.push(t);
        const clean = sanitizeTitleForScraper(t);
        if (clean !== t) searchQueries.push(clean);
      });
    } else if (typeof titlesInput === "string") {
      searchQueries.push(titlesInput);
      const clean = sanitizeTitleForScraper(titlesInput);
      if (clean !== titlesInput) searchQueries.push(clean);
    } else {
      searchQueries.push(anilistId);
    }

    // Remove duplicates from query stack
    const uniqueQueries = Array.from(new Set(searchQueries));
    let aniwatchId: string | null = null;

    // Linearly check every fallback string variant until the scraper accepts one
    for (const query of uniqueQueries) {
      console.log(`[resolver] Querying provider endpoint for match index: "${query}"`);
      aniwatchId = await findAniwatchId(malId ?? null, query);
      if (aniwatchId) {
        console.log(`[resolver] Match verified! Resolved tracking index to node ID: ${aniwatchId}`);
        break;
      }
    }

    if (aniwatchId) {
      const episodes = await awGetEpisodes(aniwatchId);
      const epEntry = episodes.find((e) => e.number === episode);

      if (epEntry) {
        // Try Dub stream configurations first
        const dubSources = await awGetSources(epEntry.episodeId, "hd-1", "dub");
        if (dubSources?.sources?.length) {
          const best = dubSources.sources.find((s) => s.isM3U8) ?? dubSources.sources[0];
          sources.push({
            label: "HD Dub",
            url: best.url,
            type: "hls",
            priority: 50,
            dubbed: true,
            headers: dubSources.headers,
            tracks: dubSources.tracks,
          });
        }

        // Sub Stream Mirror Node 1 (HD-1)
        const sub1 = await awGetSources(epEntry.episodeId, "hd-1", "sub");
        if (sub1?.sources?.length) {
          const best = sub1.sources.find((s) => s.isM3U8) ?? sub1.sources[0];
          sources.push({
            label: "HD-1 Sub",
            url: best.url,
            type: "hls",
            priority: 100,
            dubbed: false,
            headers: sub1.headers,
            tracks: sub1.tracks,
          });
        }

        // Sub Stream Mirror Node 2 (HD-2)
        const sub2 = await awGetSources(epEntry.episodeId, "hd-2", "sub");
        if (sub2?.sources?.length) {
          const best = sub2.sources.find((s) => s.isM3U8) ?? sub2.sources[0];
          sources.push({
            label: "HD-2 Sub",
            url: best.url,
            type: "hls",
            priority: 110,
            dubbed: false,
            headers: sub2.headers,
            tracks: sub2.tracks,
          });
        }

        // Sub Stream Mirror Node 3 (HD-3)
        const sub3 = await awGetSources(epEntry.episodeId, "hd-3", "sub");
        if (sub3?.sources?.length) {
          const best = sub3.sources.find((s) => s.isM3U8) ?? sub3.sources[0];
          sources.push({
            label: "HD-3 Sub",
            url: best.url,
            type: "hls",
            priority: 120,
            dubbed: false,
            headers: sub3.headers,
            tracks: sub3.tracks,
          });
        }
      }
    }
  } catch (e) {
    console.warn("[resolver] Upstream parser error in stream fallback orchestration:", e);
  }

  return sources.sort((a, b) => a.priority - b.priority);
}

export async function registerHostMapping(
  animeId: string,
  episode: number,
  host: DubbedHost,
  embedUrl: string,
  embedType: "iframe" | "hls" | "mp4" = "iframe"
): Promise<void> {
  await prisma.hostMapping.upsert({
    where: { animeId_episode_host: { animeId, episode, host } },
    create: { animeId, episode, host, embedUrl, embedType },
    update: { embedUrl, embedType },
  });
}