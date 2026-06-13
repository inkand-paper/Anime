import { awGetEpisodes, awGetSources, findAniwatchId } from "@/lib/aniwatch";
import {
  paheFindSession,
  paheGetAllEpisodes,
  paheGetStreams,
  extractKwikM3u8,
  kwikEmbedToIframe,
} from "@/lib/animepahe";

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

function sanitizeTitle(t: string): string {
  return t
    .replace(/(\d+)(?:st|nd|rd|th) Season/gi, (_, n) => `Season ${n}`)
    .replace(/\s+/g, " ")
    .trim();
}

/** Lazy DB import — skips cleanly if prisma generate hasn't been run */
async function getDbMappings(animeId: string, episode: number): Promise<VideoSource[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.hostMapping.findMany({
      where: { animeId, episode },
      orderBy: { host: "asc" },
    });
    return rows.map((m, i) => ({
      label: `${m.host[0]}${m.host.slice(1).toLowerCase()} (DUB)`,
      url: m.embedUrl,
      type: (m.embedType ?? "iframe") as VideoSource["type"],
      priority: i + 1,
      dubbed: true,
    }));
  } catch {
    return [];
  }
}

// ─── AllAnime ─────────────────────────────────────────────────────────────────

async function resolveAllAnime(
  titles: string[],
  malId: number | null | undefined,
  episode: number
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];
  try {
    let showId: string | null = null;
    for (const q of titles) {
      showId = await findAniwatchId(malId ?? null, q);
      if (showId) break;
    }
    if (!showId) return sources;

    const episodes = await awGetEpisodes(showId);
    const ep =
      episodes.find((e) => e.number === episode) ??
      episodes.find((e) => Math.abs(e.number - episode) < 0.6);
    if (!ep) return sources;

    // Dub
    const dub = await awGetSources(ep.episodeId, "hd-1", "dub");
    if (dub?.sources?.length) {
      dub.sources.forEach((s, i) =>
        sources.push({
          label: s.quality ? `DUB ${s.quality}` : i === 0 ? "DUB HD" : `DUB ${i + 1}`,
          url: s.url,
          type: s.isM3U8 ? "hls" : "mp4",
          priority: 50 + i,
          dubbed: true,
          headers: dub.headers,
          tracks: dub.tracks as VideoSource["tracks"],
        })
      );
    }

    // Sub
    const sub = await awGetSources(ep.episodeId, "hd-1", "sub");
    if (sub?.sources?.length) {
      sub.sources.forEach((s, i) =>
        sources.push({
          label: s.quality ? `SUB ${s.quality}` : i === 0 ? "SUB HD" : `SUB ${i + 1}`,
          url: s.url,
          type: s.isM3U8 ? "hls" : "mp4",
          priority: 100 + i,
          dubbed: false,
          headers: sub.headers,
          tracks: sub.tracks as VideoSource["tracks"],
        })
      );
    }
  } catch (e) {
    console.warn("[resolver] AllAnime failed:", e);
  }
  return sources;
}

// ─── AnimePahe ────────────────────────────────────────────────────────────────

async function resolveAnimePahe(
  titles: string[],
  episode: number
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];
  try {
    let session: string | null = null;
    for (const t of titles) {
      session = await paheFindSession(t);
      if (session) break;
    }
    if (!session) return sources;

    const allEps = await paheGetAllEpisodes(session);
    const ep =
      allEps.find((e) => e.episode === episode) ??
      allEps.find((e) => Math.abs(e.episode - episode) < 0.6);
    if (!ep) return sources;

    const streams = await paheGetStreams(session, ep.session);
    if (!streams.length) return sources;

    // Sort: prefer HD, then dub, then sub
    const sorted = [...streams].sort((a, b) => {
      if (b.hd !== a.hd) return Number(b.hd) - Number(a.hd);
      // eng (dub) first within same quality
      if (a.audio !== b.audio) return a.audio === "eng" ? -1 : 1;
      return 0;
    });

    // Extract m3u8 from each Kwik URL (run in parallel, cap at 3)
    const toProcess = sorted.slice(0, 4);
    const results = await Promise.allSettled(
      toProcess.map((s) => extractKwikM3u8(s.kwik))
    );

    results.forEach((r, i) => {
      const s = toProcess[i];
      const isDub = s.audio === "eng";
      const quality = s.hd === "1" ? "1080p" : "720p";
      const basePriority = isDub ? 150 : 200;

      const m3u8 = r.status === "fulfilled" ? r.value : null;

      if (m3u8) {
        // Best case: extracted real HLS m3u8
        sources.push({
          label: `Pahe ${isDub ? "DUB" : "SUB"} ${quality}`,
          url: m3u8,
          type: "hls",
          priority: basePriority + i,
          dubbed: isDub,
          headers: { Referer: "https://kwik.si/", Origin: "https://kwik.si" },
        });
      } else if (s.kwik) {
        // Fallback: embed Kwik player as iframe
        sources.push({
          label: `Pahe ${isDub ? "DUB" : "SUB"} ${quality} (embed)`,
          url: kwikEmbedToIframe(s.kwik),
          type: "iframe",
          priority: basePriority + i + 10,
          dubbed: isDub,
        });
      }
    });
  } catch (e) {
    console.warn("[resolver] AnimePahe failed:", e);
  }
  return sources;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Resolve video sources for an AniList anime ID + episode number.
 *
 * Priority order:
 *   1. Admin-uploaded dubbed files (DB HostMapping)       → priority  1–7
 *   2. AllAnime dubbed HLS                                → priority 50+
 *   3. AllAnime subbed HLS                                → priority 100+
 *   4. AnimePahe dubbed HLS (Kwik)                        → priority 150+
 *   5. AnimePahe subbed HLS (Kwik)                        → priority 200+
 */
export async function resolveVideoSources(
  anilistId: string,
  episode: number,
  titlesInput?: string | string[],
  malId?: number | null
): Promise<VideoSource[]> {
  // 1. DB overrides
  const dbSources = await getDbMappings(anilistId, episode);
  if (dbSources.length > 0) return dbSources;

  // Build title list for API searches
  const raw = Array.isArray(titlesInput) ? titlesInput : titlesInput ? [titlesInput] : [];
  const titles = Array.from(new Set(raw.flatMap((t) => [t, sanitizeTitle(t)]))).filter(Boolean);

  if (titles.length === 0) {
    console.warn(`[resolver] No titles provided for anilistId=${anilistId}`);
    return [];
  }

  // 2 & 3. AllAnime + AnimePahe — run in parallel
  const [allAnimeSources, paheSources] = await Promise.allSettled([
    resolveAllAnime(titles, malId, episode),
    resolveAnimePahe(titles, episode),
  ]);

  const sources: VideoSource[] = [
    ...(allAnimeSources.status === "fulfilled" ? allAnimeSources.value : []),
    ...(paheSources.status === "fulfilled" ? paheSources.value : []),
  ];

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
