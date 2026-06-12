/**
 * AllAnime GraphQL API Client
 *
 * AllAnime (allanime.to / allanime.day) is a free anime streaming site with
 * a public GraphQL API. It powers the popular "ani-cli" tool used by millions.
 * Status as of June 2026: ACTIVE and serving streams.
 *
 * Self-hosting the API backend is recommended for production.
 * See: https://github.com/saikou-app/saikou (reference implementation)
 *
 * API Base: https://api.allanime.day/api
 * Referer:  https://allanime.to
 */

const API_BASE   = "https://api.allanime.day/api";
const API_ORIGIN = "https://allanime.to";

const HEADERS = {
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": API_ORIGIN,
  "Referer": `${API_ORIGIN}/`,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

async function gql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const q = query.replace(/\s+/g, " ").trim();
  const url = `${API_BASE}?variables=${encodeURIComponent(
    JSON.stringify(variables)
  )}&query=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(12_000),
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`AllAnime API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AAShow {
  _id: string;
  name: string;
  englishName: string | null;
  nativeName: string | null;
  thumbnail: string | null;
  availableEpisodes: { sub: number; dub: number; raw: number };
  lastEpisodeInfo: {
    sub?: { episodeIdNum: number };
    dub?: { episodeIdNum: number };
  };
}

export interface AAEpisodeServer {
  serverId: string;
  serverName: string;
  sourceName: string;
  sourceUrl: string;
}

export interface AAEpisodeSources {
  allowsPreloading: boolean;
  sourceUrls: { url: string; sourceName: string; type: string; priority: number }[];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function aaSearch(
  query: string,
  limit = 10
): Promise<AAShow[]> {
  const data = await gql<{ shows: { edges: AAShow[] } }>(
    `query($search: SearchInput, $limit: Int) {
       shows(search: $search, limit: $limit, page: 1, translationType: sub) {
         edges {
           _id name englishName nativeName thumbnail
           availableEpisodes { sub dub raw }
           lastEpisodeInfo { sub { episodeIdNum } dub { episodeIdNum } }
         }
       }
     }`,
    { search: { query, allowAdult: false, allowUnknown: false }, limit }
  );
  return data.shows?.edges ?? [];
}

// ─── Episode list ─────────────────────────────────────────────────────────────

export async function aaGetEpisodes(
  showId: string,
  translationType: "sub" | "dub" = "sub",
  limit = 9999
): Promise<{ episodeIdNum: number; episodeNumEnd: number | null }[]> {
  const data = await gql<{ episodeInfos: { episodeIdNum: number; episodeNumEnd: number | null }[] }>(
    `query($showId: String!, $translationType: VaildTranslationTypeEnumType!, $limit: Int) {
       episodeInfos(showId: $showId, translationType: $translationType, limit: $limit) {
         episodeIdNum episodeNumEnd
       }
     }`,
    { showId, translationType, limit }
  );
  return data.episodeInfos ?? [];
}

// ─── Episode stream sources ───────────────────────────────────────────────────

export async function aaGetSources(
  showId: string,
  episodeString: string,
  translationType: "sub" | "dub" = "sub"
): Promise<AAEpisodeSources | null> {
  try {
    const data = await gql<{ episode: AAEpisodeSources }>(
      `query($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) {
         episode(showId: $showId, translationType: $translationType, episodeString: $episodeString) {
           allowsPreloading
           sourceUrls { url sourceName type priority }
         }
       }`,
      { showId, translationType, episodeString: String(episodeString) }
    );
    return data.episode ?? null;
  } catch {
    return null;
  }
}

// ─── Decode the obfuscated AllAnime source URL ────────────────────────────────
// AllAnime encodes source URLs with a simple rotation cipher (rot-based XOR).
// Reference: https://github.com/justchokingaround/jerry/blob/main/jerry.sh

export function aaDecodeUrl(encoded: string): string {
  if (!encoded.startsWith("--")) return encoded;
  const hex = encoded.slice(2);
  return hex
    .match(/.{1,2}/g)!
    .map((b) => {
      const charCode = parseInt(b, 16);
      // AllAnime uses (charCode - 56) % 256 for most chars, XOR for rest
      const decoded = charCode <= 0xff ? String.fromCharCode(((charCode + 8) % 256)) : String.fromCharCode(charCode);
      return decoded;
    })
    .join("")
    .replace("clock", "clock")
    .replace("advertisement", "");
}

// ─── Find AllAnime show ID by title/MAL ID ────────────────────────────────────

export async function findAAShowId(
  romajiTitle: string,
  malId?: number | null
): Promise<string | null> {
  // Strategy 1: search by romaji title
  const results = await aaSearch(romajiTitle, 5).catch(() => []);
  if (results.length > 0) {
    // Exact match first
    const exact = results.find(
      (r) =>
        r.name.toLowerCase() === romajiTitle.toLowerCase() ||
        r.englishName?.toLowerCase() === romajiTitle.toLowerCase()
    );
    if (exact) return exact._id;
    return results[0]._id;
  }

  // Strategy 2: try English title search if different
  if (malId) {
    const byMal = await aaSearch(`mal:${malId}`, 3).catch(() => []);
    if (byMal.length > 0) return byMal[0]._id;
  }

  return null;
}
