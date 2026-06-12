export interface AWAnime {
  id: string; name: string; jname: string; poster: string;
  duration: string; type: string; rating: string;
  episodes: { sub: number; dub: number };
}
export interface AWEpisode {
  title: string; episodeId: string; number: number; isFiller: boolean;
}
export interface AWStreamSource {
  url: string; isM3U8: boolean; type: string; quality?: string; label?: string;
}
export interface AWEpisodeSources {
  headers: Record<string, string>;
  sources: AWStreamSource[];
  tracks: any[];
  anilistID: number | null;
  malID: number | null;
}

// Updated API Target configuration matching the modern AllAnime asset delivery pipelines
const BASE_DOMAIN = "allanime.day";
const ALLANIME_API = `https://api.${BASE_DOMAIN}/api`;
const ALLANIME_REFERER = `https://${BASE_DOMAIN}`;

/**
 * Enhanced headers containing modern fetch destination signals 
 * and browser masquerade mappings to minimize Cloudflare 403 flags.
 */
function getFakeHeaders() {
  return {
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Origin": ALLANIME_REFERER,
    "Pragma": "no-cache",
    "Referer": `${ALLANIME_REFERER}/`,
    "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  };
}

/**
 * Formats data payloads into strict GET query structures 
 * mimicking AllAnime's native single-page frontend structure.
 */
async function gqlFetch(query: string, variables: Record<string, unknown>) {
  // Compress formatting tabs and line breaks down to a clean stream
  const cleanedQuery = query.replace(/\s+/g, " ").trim();
  
  const targetParams = new URLSearchParams({
    variables: JSON.stringify(variables),
    query: cleanedQuery
  });

  const finalUrl = `${ALLANIME_API}?${targetParams.toString()}`;

  const res = await fetch(finalUrl, {
    method: "GET",
    headers: getFakeHeaders(),
    next: { revalidate: 300 } // Short server side cache window to reduce API hitting
  });

  if (!res.ok) {
    console.error(`[allanime GQL Fail] Edge Status: ${res.status} ${res.statusText}`);
    throw new Error(`AllAnime API rejection: ${res.status}`);
  }

  return res.json();
}

export async function awSearch(q: string): Promise<AWAnime[]> {
  try {
    const response = await gqlFetch(`
      query($search: SearchInput, $limit: Int, $page: Int, $translationType: VaildTranslationTypeEnumType) {
        shows(search: $search, limit: $limit, page: $page, translationType: $translationType) {
          edges {
            _id
            name
            englishName
            nativeName
            thumbnail
          }
        }
      }
    `, {
      search: { q, allowAdult: true, allowUnknown: true },
      limit: 26,
      page: 1,
      translationType: "sub"
    });

    const items = response?.data?.shows?.edges ?? [];
    return items.map((node: any) => ({
      id: node._id,
      name: node.englishName || node.name || "Unknown Title",
      jname: node.nativeName || "",
      poster: node.thumbnail?.startsWith("http") ? node.thumbnail : `https://wp.allimages.workers.dev/get/${node.thumbnail}`,
      duration: "",
      type: "TV",
      rating: "",
      episodes: { sub: 0, dub: 0 }
    }));
  } catch (error) {
    console.error("[allanime] Search failure boundary reached:", error);
    return [];
  }
}

export async function awGetEpisodes(showId: string): Promise<AWEpisode[]> {
  try {
    const data = await gqlFetch(`
      query($showId: String!) {
        show(_id: $showId) {
          availableEpisodesDetail
        }
      }
    `, { showId });

    const manifests = data?.data?.show?.availableEpisodesDetail;
    const targets: string[] = manifests?.sub ?? manifests?.raw ?? [];

    return targets
      .map((num) => ({
        title: `Episode ${num}`,
        episodeId: `${showId}__${num}`,
        number: parseFloat(num),
        isFiller: false
      }))
      .sort((x, y) => x.number - y.number);
  } catch (err) {
    console.error("[allanime] Error evaluating episode nodes:", err);
    return [];
  }
}

export async function awGetSources(
  episodeId: string,
  _server: string = "hd-1",
  category: "sub" | "dub" = "sub"
): Promise<AWEpisodeSources | null> {
  try {
    const [showId, epNum] = episodeId.split("__");
    if (!showId || !epNum) return null;

    const data = await gqlFetch(`
      query($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) {
        episode(showId: $showId, translationType: $translationType, episodeString: $episodeString) {
          sourceUrls
        }
      }
    `, { showId, translationType: category, episodeString: epNum });

    const streamArray: any[] = data?.data?.episode?.sourceUrls ?? [];
    const sourceCollector: AWStreamSource[] = [];

    for (const context of streamArray) {
      let trueLink = context.sourceUrl ?? "";
      if (trueLink.startsWith("--")) {
        trueLink = decryptSourceString(trueLink);
      }

      if (!trueLink || trueLink.includes("playeradblock")) continue;
      trueLink = trueLink.replace(/^https:\/\/allanime\.day\/vidnode\/mp4\//, "");

      if (trueLink.includes(".m3u8")) {
        sourceCollector.push({ url: trueLink, isM3U8: true, type: "hls", quality: "auto" });
      } else if (trueLink.includes(".mp4")) {
        sourceCollector.push({ url: trueLink, isM3U8: false, type: "mp4", quality: "1080p" });
      }
    }

    if (sourceCollector.length === 0) return null;

    return {
      headers: { "Referer": `${ALLANIME_REFERER}/`, "User-Agent": getFakeHeaders()["User-Agent"] },
      sources: sourceCollector,
      tracks: [],
      anilistID: null,
      malID: null
    };
  } catch (err) {
    console.error("[allanime] Target resolver mapping broken:", err);
    return null;
  }
}

function decryptSourceString(input: string): string {
  const dictionary: Record<string, string> = {
    "01": "9", "08": "0", "05": "=", "0a": "2", "0b": "3", "0c": "4",
    "07": "?", "00": "8", "5c": "d", "0f": "7", "5e": "f", "17": "/",
    "1a": "b", "1b": "c", "22": "e", "25": "g", "26": "h", "2a": "l",
    "2b": "m", "2c": "n", "2e": "p", "31": "s", "35": "v", "37": "x",
    "38": "y", "3a": "{", "3b": "|", "3c": "}", "3d": "~"
  };
  const structuralHex = input.slice(2);
  let clearText = "";
  for (let pointer = 0; pointer < structuralHex.length; pointer += 2) {
    const segment = structuralHex.slice(pointer, pointer + 2);
    clearText += dictionary[segment] ?? String.fromCharCode(parseInt(segment, 16));
  }
  return clearText;
}

export async function findAniwatchId(_malId: number | null, title: string): Promise<string | null> {
  const dataset = await awSearch(title);
  if (!dataset || dataset.length === 0) return null;

  const standardQuery = title.toLowerCase().trim();
  const directMatch = dataset.find(item => 
    item.name.toLowerCase().trim() === standardQuery || 
    item.jname.toLowerCase().trim() === standardQuery
  );

  if (directMatch) return directMatch.id;

  const fuzzyMatch = dataset.find(item => 
    item.name.toLowerCase().includes(standardQuery) || 
    standardQuery.includes(item.name.toLowerCase())
  );

  return fuzzyMatch ? fuzzyMatch.id : dataset[0].id;
}