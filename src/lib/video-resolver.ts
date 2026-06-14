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

// ─── Title normalisation ──────────────────────────────────────────────────────

/**
 * Build a comprehensive list of title variants to try across APIs.
 * More variants = higher chance of matching despite different romanisations.
 */
function buildTitleVariants(titles: string[]): string[] {
  const variants = new Set<string>();

  for (const t of titles) {
    if (!t) continue;
    variants.add(t);

    // "4th Season" → "Season 4"
    const cleaned = t
      .replace(/(\d+)(?:st|nd|rd|th) Season/gi, (_, n) => `Season ${n}`)
      .replace(/\bSeason (\d+)\b/gi, "Season $1")
      .trim();
    variants.add(cleaned);

    // Strip season/part suffixes for base title search
    const base = cleaned
      .replace(/\s*(?:Season|Part|Cour)\s*\d+/gi, "")
      .replace(/\s*\d+(?:st|nd|rd|th)\s*(?:Season|Part|Cour)/gi, "")
      .trim();
    if (base && base !== cleaned) variants.add(base);
  }

  return [...variants].filter(Boolean);
}

// ─── DB overrides ─────────────────────────────────────────────────────────────

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

// ─── HiAnime (aniwatch-api) ───────────────────────────────────────────────────

async function resolveHiAnime(
  titles: string[],
  malId: number | null | undefined,
  episode: number
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];

  try {
    let showId: string | null = null;
    for (const q of titles) {
      showId = await findAniwatchId(malId ?? null, q);
      if (showId) {
        console.log(`[hianime] Matched "${q}" → ${showId}`);
        break;
      }
    }
    if (!showId) {
      console.warn(`[hianime] No match for: ${titles.slice(0, 3).join(" | ")}`);
      return sources;
    }

    const episodes = await awGetEpisodes(showId);
    const ep =
      episodes.find((e) => e.number === episode) ??
      episodes.find((e) => Math.abs(e.number - episode) < 0.6);

    if (!ep) {
      console.warn(`[hianime] Ep ${episode} not found. Available: ${episodes.slice(0,5).map(e=>e.number).join(",")}`);
      return sources;
    }

    // Try dub first, then sub
    for (const category of ["dub", "sub"] as const) {
      for (const server of ["hd-1", "hd-2"] as const) {
        const result = await awGetSources(ep.episodeId, server, category);
        if (!result?.sources?.length) continue;

        const isDub = category === "dub";
        result.sources.forEach((s, i) => {
          sources.push({
            label: s.quality
              ? `${isDub ? "DUB" : "SUB"} ${s.quality}`
              : `${isDub ? "DUB" : "SUB"} ${server.toUpperCase()}${i > 0 ? ` ${i + 1}` : ""}`,
            url: s.url,
            type: s.isM3U8 ? "hls" : "mp4",
            priority: isDub
              ? (server === "hd-1" ? 50 : 60) + i
              : (server === "hd-1" ? 100 : 110) + i,
            dubbed: isDub,
            headers: result.headers,
            tracks: result.tracks,
          });
        });
        // Got sources for this category+server — move to next category
        break;
      }
    }
  } catch (e) {
    console.warn("[hianime] Failed:", e);
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
      if (session) {
        console.log(`[animepahe] Matched "${t}" → ${session}`);
        break;
      }
    }
    if (!session) {
      console.warn(`[animepahe] No match for: ${titles.slice(0, 3).join(" | ")}`);
      return sources;
    }

    const allEps = await paheGetAllEpisodes(session);
    const ep =
      allEps.find((e) => e.episode === episode) ??
      allEps.find((e) => Math.abs(e.episode - episode) < 0.6);

    if (!ep) {
      console.warn(`[animepahe] Ep ${episode} not found. Has ${allEps.length} eps.`);
      return sources;
    }

    const streams = await paheGetStreams(session, ep.session);
    if (!streams.length) return sources;

    // HD first, then dub over sub within same quality
    const sorted = [...streams].sort((a, b) => {
      if (b.hd !== a.hd) return Number(b.hd) - Number(a.hd);
      return a.audio === "eng" ? -1 : 1;
    });

    const toProcess = sorted.slice(0, 4);
    const m3u8Results = await Promise.allSettled(
      toProcess.map((s) => extractKwikM3u8(s.kwik))
    );

    m3u8Results.forEach((r, i) => {
      const s = toProcess[i];
      const isDub = s.audio === "eng";
      const quality = s.hd === "1" ? "1080p" : "720p";
      const base = isDub ? 150 : 200;

      const m3u8 = r.status === "fulfilled" ? r.value : null;

      if (m3u8) {
        sources.push({
          label: `Pahe ${isDub ? "DUB" : "SUB"} ${quality}`,
          url: m3u8,
          type: "hls",
          priority: base + i,
          dubbed: isDub,
          headers: { Referer: "https://kwik.si/", Origin: "https://kwik.si" },
        });
      } else if (s.kwik) {
        // Embed Kwik player directly as iframe fallback
        sources.push({
          label: `Pahe ${isDub ? "DUB" : "SUB"} ${quality}`,
          url: kwikEmbedToIframe(s.kwik),
          type: "iframe",
          priority: base + i + 10,
          dubbed: isDub,
        });
      }
    });
  } catch (e) {
    console.warn("[animepahe] Failed:", e);
  }

  return sources;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export async function resolveVideoSources(
  anilistId: string,
  episode: number,
  titlesInput?: string | string[],
  malId?: number | null
): Promise<VideoSource[]> {
  // 1. Admin-uploaded dubbed files always win
  const dbSources = await getDbMappings(anilistId, episode);
  if (dbSources.length > 0) return dbSources;

  // 2. Build title variants
  const raw = Array.isArray(titlesInput)
    ? titlesInput
    : titlesInput ? [titlesInput] : [];
  const titles = buildTitleVariants(raw);

  if (!titles.length) {
    console.warn(`[resolver] No titles for anilistId=${anilistId}`);
    return [];
  }

  // 3. HiAnime + AnimePahe in parallel
  const [hiResults, paheResults] = await Promise.allSettled([
    resolveHiAnime(titles, malId, episode),
    resolveAnimePahe(titles, episode),
  ]);

  const sources: VideoSource[] = [
    ...(hiResults.status === "fulfilled" ? hiResults.value : []),
    ...(paheResults.status === "fulfilled" ? paheResults.value : []),
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
