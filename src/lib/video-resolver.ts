import { prisma } from "@/lib/prisma";
import { getAnimeInfo, getEpisodeSources } from "@/lib/consumet";

export interface VideoSource {
  label: string;
  url: string;
  type: "iframe" | "hls" | "mp4";
  priority: number;
  dubbed?: boolean;
}

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

export async function resolveVideoSources(
  animeId: string,
  episode: number
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];

  // 1. Dubbed sources from database (highest priority)
  try {
    const mappings = await prisma.hostMapping.findMany({
      where: { animeId, episode },
      orderBy: { hostName: "asc" },
    });

    mappings.forEach((m, i) => {
      sources.push({
        label: `${m.hostName} (DUB)`,
        url: m.url,
        type: (m.type as "iframe" | "hls" | "mp4") ?? "iframe",
        priority: i + 1,
        dubbed: true,
      });
    });
  } catch (err) {
    console.warn("[resolver] DB host_mapping lookup failed:", err);
  }

  // 2. Internal Scraper / Consumet Fallback (subbed)
  try {
    const animeInfo = await getAnimeInfo(animeId);
    if (animeInfo) {
      console.log(`[resolver] Found info for ${animeId}, episodes: ${animeInfo.episodes.length}`);
      const epEntry = animeInfo.episodes.find(e => e.number === episode);
      
      if (epEntry) {
        console.log(`[resolver] Found episode match for ep ${episode}, id: ${epEntry.id}`);
        const episodeSources = await getEpisodeSources(epEntry.id);
        if (episodeSources) {
          episodeSources.sources.forEach((src, i) => {
            console.log(`[resolver] Resolved Source [${i}]:`, src.url);
            sources.push({
              label: src.label || `Server ${i + 1}`,
              url: src.url,
              type: src.type as "iframe" | "hls" | "mp4",
              priority: 100 + i,
              dubbed: false,
            });
          });
        }
      } else {
        console.warn(`[resolver] No episode match found for ep ${episode} in ${animeId}`);
      }
    } else {
      console.warn(`[resolver] No info found for ${animeId}`);
    }
  } catch (err) {
    console.warn("[resolver] Fallback scraper failed:", err);
  }

  return sources.sort((a, b) => a.priority - b.priority);
}

export async function registerHostMapping(
  animeId: string,
  episode: number,
  hostName: DubbedHost,
  url: string,
  type: "iframe" | "hls" | "mp4" = "iframe"
): Promise<void> {
  await prisma.hostMapping.upsert({
    where: { animeId_episode_hostName: { animeId, episode, hostName } },
    create: { animeId, episode, hostName, url, type },
    update: { url, type },
  });
  console.log(`[host-mapping] Registered ${hostName} for ${animeId} ep${episode}`);
}
