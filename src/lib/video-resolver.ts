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
  "DOODSTREAM", "VOE", "FILEMOON", "STREAMWISH",
  "STREAMTAPE", "MIXDROP", "MEGASTREAM",
] as const;

export type DubbedHost = (typeof DUBBED_HOSTS)[number];

/**
 * Sanitize season suffixes that confuse search matching.
 * e.g. "Attack on Titan 2nd Season" → "Attack on Titan Season 2"
 */
function sanitizeTitle(title: string): string {
  return title
    .replace(/(\d+)(?:st|nd|rd|th) Season/gi, (_, n) => `Season ${n}`)
    .replace(/Part (\d+)/gi, "Part $1")
    .trim();
}

/**
 * Resolve playable video sources for an AniList anime + episode.
 *
 * Priority:
 *  1. Dubbed uploads in HostMapping DB (admin-uploaded, priority 1–7)
 *  2. AllAnime dubbed HLS (priority 50)
 *  3. AllAnime subbed HLS — all quality variants from one API call (priority 100+)
 *  4. AnimePahe (priority 200+, imported on demand to avoid circular deps)
 */
export async function resolveVideoSources(
  anilistId: string,
  episode: number,
  titlesInput?: string | string[],
  malId?: number | null
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];

  // ── 1. DB dubbed overrides ────────────────────────────────────────────────
  try {
    const mappings = await prisma.hostMapping.findMany({
      where: { animeId: anilistId, episode },
      orderBy: { host: "asc" },
    });
    mappings.forEach((m, i) => {
      sources.push({
        label: `${m.host[0]}${m.host.slice(1).toLowerCase()} (DUB)`,
        url: m.embedUrl,
        type: (m.embedType as VideoSource["type"]) ?? "iframe",
        priority: i + 1,
        dubbed: true,
      });
    });
  } catch (e) {
    console.warn("[resolver] DB lookup failed:", e);
  }

  // Return early if we have manually uploaded dubbed content
  if (sources.length > 0) {
    return sources;
  }

  // ── 2. AllAnime streaming API ─────────────────────────────────────────────
  try {
    // Build deduplicated search query list
    const rawTitles = Array.isArray(titlesInput)
      ? titlesInput
      : titlesInput
      ? [titlesInput]
      : [];
    const queries = Array.from(
      new Set(rawTitles.flatMap((t) => [t, sanitizeTitle(t)]))
    ).filter(Boolean);
    if (queries.length === 0 && anilistId) queries.push(anilistId);

    // Find the show ID on AllAnime
    let showId: string | null = null;
    for (const q of queries) {
      showId = await findAniwatchId(malId ?? null, q);
      if (showId) break;
    }

    if (!showId) {
      console.warn(`[resolver] No AllAnime match for: ${queries.join(", ")}`);
      return sources;
    }

    // Fetch episode list
    const episodes = await awGetEpisodes(showId);
    const epEntry  = episodes.find((e) => e.number === episode)
                  ?? episodes.find((e) => Math.abs(e.number - episode) < 0.1);

    if (!epEntry) {
      console.warn(`[resolver] Episode ${episode} not found in AllAnime for show ${showId}`);
      return sources;
    }

    // Dub (one call — AllAnime returns all quality variants together)
    const dubResult = await awGetSources(epEntry.episodeId, "hd-1", "dub");
    if (dubResult?.sources?.length) {
      dubResult.sources.forEach((s, i) => {
        sources.push({
          label: s.quality ? `DUB ${s.quality}` : i === 0 ? "DUB HD" : `DUB ${i + 1}`,
          url: s.url,
          type: s.isM3U8 ? "hls" : "mp4",
          priority: 50 + i,
          dubbed: true,
          headers: dubResult.headers,
          tracks: dubResult.tracks as VideoSource["tracks"],
        });
      });
    }

    // Sub
    const subResult = await awGetSources(epEntry.episodeId, "hd-1", "sub");
    if (subResult?.sources?.length) {
      subResult.sources.forEach((s, i) => {
        sources.push({
          label: s.quality ? `SUB ${s.quality}` : i === 0 ? "SUB HD" : `SUB ${i + 1}`,
          url: s.url,
          type: s.isM3U8 ? "hls" : "mp4",
          priority: 100 + i,
          dubbed: false,
          headers: subResult.headers,
          tracks: subResult.tracks as VideoSource["tracks"],
        });
      });
    }
  } catch (e) {
    console.warn("[resolver] AllAnime failed:", e);
  }

  return sources.sort((a, b) => a.priority - b.priority);
}

export async function registerHostMapping(
  animeId: string,
  episode: number,
  host: DubbedHost,
  embedUrl: string,
  embedType: VideoSource["type"] = "iframe"
): Promise<void> {
  await prisma.hostMapping.upsert({
    where: { animeId_episode_host: { animeId, episode, host } },
    create: { animeId, episode, host, embedUrl, embedType },
    update: { embedUrl, embedType },
  });
}
