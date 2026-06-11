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
 * Resolve video sources for a given AniList anime ID + episode number.
 *
 * Priority order:
 *  1. Dubbed uploads in HostMapping DB (priority 1–7)
 *  2. AniWatch HLS dub (priority 50)
 *  3. AniWatch HLS sub HD-1 (priority 100)
 *  4. AniWatch HLS sub HD-2 (priority 110)
 *  5. AniWatch HLS sub HD-3 (priority 120)
 */
export async function resolveVideoSources(
  anilistId: string,
  episode: number,
  romajiTitle?: string,
  malId?: number | null
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];

  // ── 1. Dubbed DB mappings ────────────────────────────────────────────────
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
    console.warn("[resolver] DB lookup failed:", e);
  }

  // ── 2. AniWatch streaming API ────────────────────────────────────────────
  try {
    const title = romajiTitle ?? anilistId;
    const aniwatchId = await findAniwatchId(malId ?? null, title);

    if (aniwatchId) {
      const episodes = await awGetEpisodes(aniwatchId);
      const epEntry = episodes.find((e) => e.number === episode);

      if (epEntry) {
        // Try dub first
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

        // Sub HD-1
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

        // Sub HD-2
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

        // Sub HD-3
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
    console.warn("[resolver] AniWatch failed:", e);
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
