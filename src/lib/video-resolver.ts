import { buildEmbedSources } from "@/lib/aniwatch";
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

// ─── Title variants ───────────────────────────────────────────────────────────

function buildTitleVariants(titles: string[]): string[] {
  const variants = new Set<string>();
  for (const t of titles) {
    if (!t) continue;
    variants.add(t);
    const cleaned = t
      .replace(/(\d+)(?:st|nd|rd|th) Season/gi, (_, n) => `Season ${n}`)
      .trim();
    variants.add(cleaned);
    const base = cleaned
      .replace(/\s*(Season|Part|Cour)\s*\d+/gi, "")
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

// ─── MAL ID embed providers ───────────────────────────────────────────────────

function resolveEmbeds(malId: number | null | undefined, episode: number): VideoSource[] {
  if (!malId) return [];
  return buildEmbedSources(malId, episode).map((s) => ({
    label: s.label,
    url: s.url,
    type: "iframe" as const,
    priority: s.priority,
    dubbed: false, // embed providers serve sub by default; some have dub toggle inside player
  }));
}

// ─── AnimePahe (HLS via Kwik) ─────────────────────────────────────────────────

async function resolveAnimePahe(titles: string[], episode: number): Promise<VideoSource[]> {
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
      console.warn(`[animepahe] Ep ${episode} not found (has ${allEps.length} eps)`);
      return sources;
    }

    const streams = await paheGetStreams(session, ep.session);
    if (!streams.length) return sources;

    // Sort: HD first, dub before sub within same quality
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

/**
 * Source priority:
 *  1-7   DB HostMapping (admin dubbed uploads)
 *  10-40 MAL-ID embed providers (VidSrc, 2Embed, etc.) — always available
 *  150+  AnimePahe DUB HLS
 *  200+  AnimePahe SUB HLS
 */
export async function resolveVideoSources(
  anilistId: string,
  episode: number,
  titlesInput?: string | string[],
  malId?: number | null
): Promise<VideoSource[]> {
  // 1. Admin uploads always win
  const dbSources = await getDbMappings(anilistId, episode);
  if (dbSources.length > 0) return dbSources;

  // 2. Build title variants for AnimePahe search
  const raw = Array.isArray(titlesInput) ? titlesInput : titlesInput ? [titlesInput] : [];
  const titles = buildTitleVariants(raw);

  // 3. MAL embed providers + AnimePahe in parallel
  const embedSources = resolveEmbeds(malId, episode); // sync, always instant
  const paheSources  = await resolveAnimePahe(titles, episode).catch(() => []);

  const all = [...embedSources, ...paheSources];
  return all.sort((a, b) => a.priority - b.priority);
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
    console.error("[registerHostMapping]", e);
  }
}
