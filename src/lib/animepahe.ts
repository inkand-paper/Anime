/**
 * AnimePahe API Client
 *
 * AnimePahe (animepahe.ru / animepahe.com) serves high-quality 720p/1080p
 * streams via kwik.si. It has a public JSON API and is actively maintained.
 * Status as of June 2026: ACTIVE.
 *
 * Streams come from kwik.si which requires extracting the m3u8 URL from
 * the page HTML. We do that extraction server-side so no CORS issues.
 */

const PAHE_BASE  = "https://animepahe.ru";
const KWIK_BASE  = "https://kwik.si";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaheAnime {
  id: number;
  slug: string;
  title: string;
  type: string;
  episodes: number;
  status: string;
  season: string;
  year: number;
  poster: string;
  session: string;
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
  audio: string;
  duration: string;
  created_at: string;
  session: string;
  filler: number;
}

export interface PaheStreamSource {
  url: string;
  resolution: string;
  audio: string;
  kwikUrl: string;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function paheSearch(query: string): Promise<PaheAnime[]> {
  const res = await fetch(
    `${PAHE_BASE}/api?m=search&q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": UA,
        Referer: `${PAHE_BASE}/`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

// ─── Episodes list ────────────────────────────────────────────────────────────

export async function paheGetEpisodes(
  animeSession: string,
  page = 1
): Promise<{ data: PaheEpisode[]; total: number; per_page: number; current_page: number; last_page: number }> {
  const res = await fetch(
    `${PAHE_BASE}/api?m=release&id=${animeSession}&sort=episode_asc&page=${page}`,
    {
      headers: {
        "User-Agent": UA,
        Referer: `${PAHE_BASE}/`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) return { data: [], total: 0, per_page: 30, current_page: 1, last_page: 1 };
  return res.json();
}

// ─── Get Kwik embed links for an episode ─────────────────────────────────────

export async function paheGetLinks(
  animeSession: string,
  episodeSession: string
): Promise<PaheStreamSource[]> {
  const res = await fetch(
    `${PAHE_BASE}/api?m=links&id=${animeSession}&session=${episodeSession}&p=kwik`,
    {
      headers: {
        "User-Agent": UA,
        Referer: `${PAHE_BASE}/`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.data) return [];

  // data.data is an array of objects keyed by quality: e.g. { "720": { kwik: "https://..." } }
  const sources: PaheStreamSource[] = [];
  for (const entry of data.data) {
    for (const [res, info] of Object.entries(entry as Record<string, { kwik: string; audio: string }>)) {
      sources.push({
        url: "",
        resolution: `${res}p`,
        audio: info.audio ?? "jpn",
        kwikUrl: info.kwik,
      });
    }
  }
  return sources;
}

// ─── Extract real m3u8 from Kwik embed page ───────────────────────────────────
// Kwik obfuscates the m3u8 URL inside eval(p,a,c,k,e,d) JavaScript.
// We fetch the page HTML server-side and regex it out.

export async function kwikExtractM3u8(kwikUrl: string): Promise<string | null> {
  try {
    // Step 1: Get the kwik embed page (requires Referer from animepahe)
    const pageRes = await fetch(kwikUrl, {
      headers: {
        "User-Agent": UA,
        Referer: `${PAHE_BASE}/`,
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });

    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    // Step 2: Find the eval(function(p,a,c,k,e,d) block
    const evalMatch = html.match(/eval\(function\(p,a,c,k,e,(?:d|f)\).*?<\/script>/s);
    if (!evalMatch) {
      // Try direct m3u8 regex as fallback
      const directMatch = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
      return directMatch ? directMatch[0] : null;
    }

    // Step 3: Execute the packed JS to get the real code
    // We implement a simple unpacker for p,a,c,k,e,d format
    const packed = evalMatch[0].replace(/<\/script>$/, "");
    const unpacked = unpackEval(packed);

    // Step 4: Extract m3u8 from unpacked code
    const m3u8Match = unpacked.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    return m3u8Match ? m3u8Match[0] : null;
  } catch {
    return null;
  }
}

// ─── Simple p,a,c,k,e,d unpacker ─────────────────────────────────────────────

function unpackEval(packed: string): string {
  try {
    // Extract the p,a,c,k,e,d arguments
    const match = packed.match(
      /\}\s*\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*\.split\(/
    );
    if (!match) return packed;

    let [, p, a, , k] = match;
    const base = parseInt(a, 10);
    const keys = k.split("|");

    // Replace each token
    return p.replace(/\b\w+\b/g, (word) => {
      const idx = parseInt(word, base) || 0;
      return keys[idx] || word;
    });
  } catch {
    return packed;
  }
}

// ─── Find AnimePahe session by title ─────────────────────────────────────────

export async function findPaheSession(title: string): Promise<string | null> {
  const results = await paheSearch(title).catch(() => []);
  if (results.length === 0) return null;

  const exact = results.find(
    (r) => r.title.toLowerCase() === title.toLowerCase()
  );
  return (exact ?? results[0]).session;
}
