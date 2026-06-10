/**
 * Video Source Resolver
 *
 * Resolution order for any given anime + episode:
 *
 *  1. DB lookup — check if a DUBBED version is mapped to any of the 7 hosts
 *     (Doodstream → VOE → Filemoon → Streamwish → Streamtape → MixDrop → Megastream)
 *  2. Consumet/Gogoanime — free open-source API for subbed content
 *     Primary server: gogocdn, fallback: vidstreaming
 *  3. Consumet/Zoro — secondary provider fallback (subbed, high quality)
 *
 * The VideoPlayer component tries sources in priority order and auto-falls back
 * to the next one if a source errors.
 */

import { getAnimeInfo, getEpisodeSources } from "./consumet";

export interface VideoSource {
  label: string;
  url: string;
  type: "iframe" | "hls" | "mp4";
  priority: number;
  dubbed?: boolean;
}

// ─── The 7 required dubbed-upload hosts ──────────────────────────────────────
// These URLs are populated from the host_mapping table in your DB.
// Use registerHostMapping() below after uploading a dubbed file to a host.

export const DUBBED_HOSTS = [
  "Doodstream",
  "VOE",
  "Filemoon",
  "Streamwish",
  "Streamtape",
  "MixDrop",
  "Megastream",
] as const;

export type DubbedHost = (typeof DUBBED_HOSTS)[number];

// ─── Main resolver ────────────────────────────────────────────────────────────

export async function resolveVideoSources(
  animeId: string,
  episode: number
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];

  // ── Step 1: Dubbed sources from DB (host_mapping table) ──────────────────
  // In production, replace this with a real DB query:
  //
  //   const mappings = await prisma.hostMapping.findMany({
  //     where: { animeId, episode },
  //     orderBy: { host: "asc" },
  //   });
  //   mappings.forEach((m, i) => sources.push({
  //     label: `${m.host} (DUB)`,
  //     url: m.embedUrl,
  //     type: "iframe",
  //     priority: i + 1,
  //     dubbed: true,
  //   }));
  //
  // For now we leave this as a no-op — dubbed entries appear once you run
  // the upload coordinator script and call registerHostMapping().

  // ── Step 2: Free subbed content via Consumet → Gogoanime ─────────────────
  try {
    // Gogoanime IDs look like "one-piece" or "one-piece-dub"
    // We treat the animeId as the Gogoanime slug directly.
    const info = await getAnimeInfo(animeId, "gogoanime");

    if (info && info.episodes?.length >= episode) {
      const epEntry = info.episodes.find((e) => e.number === episode) ?? info.episodes[episode - 1];

      if (epEntry) {
        // Primary Gogoanime server (gogocdn — most reliable)
        const gogoPrimary = await getEpisodeSources(epEntry.id, "gogoanime", "gogocdn");
        if (gogoPrimary?.sources) {
          gogoPrimary.sources.forEach((src, i) => {
            sources.push({
              label: `Gogoanime${src.quality ? ` ${src.quality}` : ""}`,
              url: src.url,
              type: src.isM3U8 ? "hls" : "mp4",
              priority: 100 + i,
              dubbed: false,
            });
          });
        }

        // Fallback Gogoanime server (vidstreaming)
        const gogoFallback = await getEpisodeSources(epEntry.id, "gogoanime", "vidstreaming");
        if (gogoFallback?.sources) {
          gogoFallback.sources.slice(0, 2).forEach((src, i) => {
            sources.push({
              label: `Vidstreaming${src.quality ? ` ${src.quality}` : ""}`,
              url: src.url,
              type: src.isM3U8 ? "hls" : "mp4",
              priority: 200 + i,
              dubbed: false,
            });
          });
        }
      }
    }
  } catch (err) {
    console.warn("[resolver] Gogoanime fetch failed:", err);
  }

  // ── Step 3: Consumet → Zoro fallback ─────────────────────────────────────
  if (sources.length === 0) {
    try {
      const zoroInfo = await getAnimeInfo(animeId, "zoro");
      if (zoroInfo && zoroInfo.episodes?.length >= episode) {
        const epEntry = zoroInfo.episodes.find((e) => e.number === episode) ?? zoroInfo.episodes[episode - 1];
        if (epEntry) {
          const zoroSources = await getEpisodeSources(epEntry.id, "zoro", "vidcloud");
          if (zoroSources?.sources) {
            zoroSources.sources.forEach((src, i) => {
              sources.push({
                label: `Zoro${src.quality ? ` ${src.quality}` : ""}`,
                url: src.url,
                type: src.isM3U8 ? "hls" : "mp4",
                priority: 300 + i,
                dubbed: false,
              });
            });
          }
        }
      }
    } catch (err) {
      console.warn("[resolver] Zoro fetch failed:", err);
    }
  }

  // Sort by priority (dubbed first, then by quality tier)
  return sources.sort((a, b) => a.priority - b.priority);
}

// ─── Coordinator: register a dubbed upload ────────────────────────────────────

/**
 * Call this after you upload a dubbed video file to one of the 7 hosts.
 * It records the embed URL so resolveVideoSources() can return it.
 *
 * Usage (in your upload script or admin action):
 *   await registerHostMapping("one-piece", 1, "Doodstream", "https://dood.re/e/xxxx");
 */
export async function registerHostMapping(
  animeId: string,
  episode: number,
  host: DubbedHost,
  embedUrl: string
): Promise<void> {
  // Replace with real DB write:
  // await prisma.hostMapping.upsert({
  //   where: { animeId_episode_host: { animeId, episode, host } },
  //   create: { animeId, episode, host, embedUrl },
  //   update: { embedUrl },
  // });
  console.log(`[host-mapping] Registered ${host} for ${animeId} ep${episode}: ${embedUrl}`);
}
