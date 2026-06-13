/**
 * AnimePahe API Client
 *
 * AnimePahe (animepahe.ru) is one of the most stable free anime streaming
 * sites. It has a clean JSON API (no scraping needed), serves 720p/1080p
 * streams via Kwik player, and has been reliably running since 2016.
 *
 * API base: https://animepahe.ru/api
 * Kwik player: https://kwik.si  (previously kwik.cx / kwik.pw)
 *
 * Stream extraction: Kwik encodes a redirect m3u8 URL inside the page HTML
 * which we extract server-side and proxy through our HLS proxy.
 */

const PAHE_BASE    = "https://animepahe.ru";
const PAHE_API     = `${PAHE_BASE}/api`;
const KWIK_REFERER = "https://animepahe.ru/";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Cookie: "__ddgid_=; __ddg1_=; __ddg2_=;", // bypass DDoS-Guard basics
  Referer: PAHE_BASE,
};

const TIMEOUT = 12_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaheSearchResult {
  id: number;
  title: string;
  image: string;
  type: string;
  status: string;
  season: string;
  year: number;
  score: number;
  slug: string;
  session: string; // UUID used for episode lookups
}

export interface PaheEpisode {
  id: number;
  anime_id: number;
  episode: number;
  episode2: number;
  edition: string;
  title: string;
  snapshot: string;
  disc: string;
  audio: string;    // "jpn" = sub, "eng" = dub
  duration: string;
  session: string;  // UUID used for stream lookups
  filler: number;
}

export interface PaheStream {
  audio: string;    // "jpn" | "eng"
  kwik: string;     // Kwik player URL
  kwik_pahewin: string;
  hd: string;       // "1" | "0"
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function paheGet<T>(path: string, cache = 300): Promise<T> {
  const url = `${PAHE_API}?${path}`;
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT),
    next: { revalidate: cache },
  });
  if (!res.ok) throw new Error(`AnimePahe API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function paheSearch(query: string): Promise<PaheSearchResult[]> {
  try {
    const data = await paheGet<{ data: PaheSearchResult[] }>(
      `m=search&q=${encodeURIComponent(query)}`,
      60
    );
    return data.data ?? [];
  } catch {
    return [];
  }
}

// ─── Episode list (paginated) ──────────────────────────────────────────────────

export async function paheGetEpisodes(
  session: string,
  page = 1
): Promise<{ total: number; episodes: PaheEpisode[] }> {
  try {
    const data = await paheGet<{
      total: number;
      per_page: number;
      data: PaheEpisode[];
    }>(`m=release&id=${session}&sort=episode_asc&page=${page}`);
    return { total: data.total, episodes: data.data ?? [] };
  } catch {
    return { total: 0, episodes: [] };
  }
}

/**
 * Fetch all episodes across all pages for a session.
 * AnimePahe paginates at 30 per page.
 */
export async function paheGetAllEpisodes(session: string): Promise<PaheEpisode[]> {
  const first = await paheGetEpisodes(session, 1);
  if (!first.episodes.length) return [];

  const perPage = 30;
  const totalPages = Math.ceil(first.total / perPage);
  if (totalPages <= 1) return first.episodes;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => paheGetEpisodes(session, i + 2))
  );

  return [
    ...first.episodes,
    ...remaining.flatMap((p) => p.episodes),
  ];
}

// ─── Streams for a specific episode ───────────────────────────────────────────

export async function paheGetStreams(
  animeSession: string,
  episodeSession: string
): Promise<PaheStream[]> {
  try {
    const data = await paheGet<{ data: Record<string, PaheStream> }>(
      `m=links&id=${animeSession}&session=${episodeSession}&p=kwik`,
      60
    );
    return Object.values(data.data ?? {});
  } catch {
    return [];
  }
}

// ─── Kwik stream extraction ───────────────────────────────────────────────────
// Kwik embeds the m3u8 URL inside a <script> tag with an eval() payload.
// We fetch the page server-side and extract the m3u8 via regex.

export async function extractKwikM3u8(kwikUrl: string): Promise<string | null> {
  try {
    const res = await fetch(kwikUrl, {
      headers: {
        ...HEADERS,
        Referer: KWIK_REFERER,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(TIMEOUT),
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Kwik embeds the stream in one of two formats depending on version:
    // 1. Direct: https://...kwik.si/.../index-f2.m3u8 in a <source> tag
    // 2. Packed eval: `eval(function(p,a,c,k,e,d){...}` containing the m3u8
    //
    // Try direct source first
    let match = html.match(/source=['"]([^'"]+\.m3u8[^'"]*)['"]/i);
    if (match?.[1]) return match[1];

    // Try inside a script block
    match = html.match(/https?:\/\/[^'"<\s]+\.m3u8[^'"<\s]*/i);
    if (match?.[0]) return match[0];

    // Kwik eval() packer — decode p,a,c,k,e,d
    const evalMatch = html.match(/eval\(function\(p,a,c,k,e,d\)\{.+\}\)/s);
    if (evalMatch) {
      const decoded = unsafeUnpack(evalMatch[0]);
      const m3u8Match = decoded.match(/https?:\/\/[^'"<\s]+\.m3u8[^'"<\s]*/i);
      if (m3u8Match?.[0]) return m3u8Match[0];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Minimal p,a,c,k,e,d unpacker (Dean Edwards packer).
 * Only handles the subset Kwik uses — does NOT eval JS.
 */
function unsafeUnpack(packedCode: string): string {
  try {
    // Extract the payload string between the outer function's string args
    // Pattern: eval(function(p,a,c,k,e,d){...}('PAYLOAD',RADIX,COUNT,'k|e|y|s'.split('|'),...))
    const argsMatch = packedCode.match(
      /\}\s*\(\s*'([\s\S]+?)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]+?)'\s*\.split/
    );
    if (!argsMatch) return "";

    const payload = argsMatch[1].replace(/\\'/g, "'");
    const radix   = parseInt(argsMatch[2], 10);
    const keys    = argsMatch[4].split("|");

    // Replace each word token with the corresponding key
    return payload.replace(/\b(\w+)\b/g, (word) => {
      const idx = parseInt(word, radix);
      return isNaN(idx) || !keys[idx] ? word : keys[idx];
    });
  } catch {
    return "";
  }
}

// ─── High-level: find AnimePahe session for an anime ─────────────────────────

/**
 * Find the AnimePahe session UUID for an anime by title.
 * Tries exact match first, then falls back to first result.
 */
export async function paheFindSession(title: string): Promise<string | null> {
  const results = await paheSearch(title);
  if (!results.length) return null;

  const q = title.toLowerCase().trim();
  const exact = results.find(
    (r) =>
      r.title.toLowerCase() === q ||
      r.title.toLowerCase().replace(/[^a-z0-9 ]/g, "") === q.replace(/[^a-z0-9 ]/g, "")
  );
  return (exact ?? results[0]).session;
}
