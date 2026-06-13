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

/** Fix season naming variants that break title matching */
function sanitizeTitle(title: string): string {
  return title
    .replace(/(\d+)(?:st|nd|rd|th) Season/gi, (_, n) => `Season ${n}`)
    .replace(/Season (\d+)/gi, "Season $1")
    .trim();
}

/**
 * Lazy-load prisma so a missing generated client doesn't crash the
 * entire module import. Episode streaming still works without a DB.
 */
async function getDbMappings(
  animeId: string,
  episode: number
): Promise<VideoSource[]> {
  try {
    // Dynamic import — if @prisma/client isn't generated yet this throws
    // inside the try/catch instead of at module-load time
    const { prisma } = await import("@/lib/prisma");
    const mappings = await prisma.hostMapping.findMany({
      where: { animeId, episode },
      orderBy: { host: "asc" },
    });
    return mappings.map((m, i) => ({
      label: `${m.host[0]}${m.host.slice(1).toLowerCase()} (DUB)`,
      url: m.embedUrl,
      type: (m.embedType ?? "iframe") as VideoSource["type"],
      priority: i + 1,
      dubbed: true,
    }));
  } catch {
    // Prisma not generated or DB not reachable — skip silently
    return [];
  }
}

/**
 * Resolve video sources for an AniList anime ID + episode number.
 *
 * Order:
 *  1. Admin-uploaded dubbed files in DB (HostMapping)
 *  2. AllAnime dubbed HLS streams
 *  3. AllAnime subbed HLS streams
 */
export async function resolveVideoSources(
  anilistId: string,
  episode: number,
  titlesInput?: string | string[],
  malId?: number | null
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];

  // ── 1. DB dubbed overrides ────────────────────────────────────────────────
  const dbSources = await getDbMappings(anilistId, episode);
  if (dbSources.length > 0) {
    // Have manually uploaded dubbed content — return immediately, no API needed
    return dbSources;
  }

  // ── 2. AllAnime streaming API ─────────────────────────────────────────────
  try {
    const rawTitles = Array.isArray(titlesInput)
      ? titlesInput
      : titlesInput
      ? [titlesInput]
      : [];

    // Build deduplicated search queries including sanitized variants
    const queries = Array.from(
      new Set(rawTitles.flatMap((t) => [t, sanitizeTitle(t)]))
    ).filter(Boolean);

    if (queries.length === 0) {
      console.warn(`[resolver] No title provided for anilistId=${anilistId}`);
      return sources;
    }

    // Try each title variant until AllAnime returns a match
    let showId: string | null = null;
    for (const q of queries) {
      showId = await findAniwatchId(malId ?? null, q);
      if (showId) break;
    }

    if (!showId) {
      console.warn(`[resolver] No AllAnime match for: ${queries.join(" | ")}`);
      return sources;
    }

    // Fetch episode list
    const episodes = await awGetEpisodes(showId);
    // Try exact match first, then nearest (handles 0.5 episode numbers)
    const epEntry =
      episodes.find((e) => e.number === episode) ??
      episodes.find((e) => Math.abs(e.number - episode) < 0.6);

    if (!epEntry) {
      console.warn(
        `[resolver] Episode ${episode} not in AllAnime list for show ${showId}. ` +
        `Available: ${episodes.map((e) => e.number).join(", ")}`
      );
      return sources;
    }

    // Dub stream — AllAnime returns all quality variants in one response
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

    // Sub stream
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
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.hostMapping.upsert({
      where: { animeId_episode_host: { animeId, episode, host } },
      create: { animeId, episode, host, embedUrl, embedType },
      update: { embedUrl, embedType },
    });
  } catch (e) {
    console.error("[registerHostMapping] Failed:", e);
  }
}
