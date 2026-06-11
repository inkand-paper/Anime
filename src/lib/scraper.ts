import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Internal Scraper (Replacement for DMCA'd Consumet API)
 * 
 * UPGRADED: Support for the new AniNeko.to (Gogoanime Rebrand)
 */

const ANIME_MIRRORS = [
  "https://anineko.to",
  "https://anitaku.to",
  "https://gogoanime3.co",
  "https://gogoanime.hu",
  "https://gogoanime.vc",
];
let SCRAPER_BASE = ANIME_MIRRORS[0];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://anineko.to/",
};

// ─── Parallel Retry Helper ───────────────────────────────────────────────────

async function tryAllMirrors<T>(fn: (mirror: string) => Promise<T>): Promise<T | null> {
  const promises = ANIME_MIRRORS.map(m => fn(m));
  
  try {
    const result = await Promise.any(promises);
    return result;
  } catch (e: any) {
    console.error("[scraper] All mirrors failed.");
    return null;
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAnimeDirect(query: string): Promise<ScraperAnime[]> {
  const result = await tryAllMirrors(async (mirror) => {
    // handles both anineko and standard gogo structures
    const isStandard = mirror.includes("gogoanime");
    const searchPath = isStandard ? `/search.html?keyword=${encodeURIComponent(query)}` : `/browse?q=${encodeURIComponent(query)}`;
    const url = `${mirror}${searchPath}`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(data);
    const results: ScraperAnime[] = [];

    $("a.nv-anime-thumb, a.nv-browse-thumb").each((_, el) => {
      const a = $(el);
      const title = a.find("strong").text().trim() || a.attr("title") || "";
      const img = a.find("img").attr("src");
      const href = a.attr("href");
      let id = href?.replace("/", "") || "";
      if (id.startsWith("watch/")) id = id.replace("watch/", "");
      id = id.split("-episode-")[0].split("/ep-")[0].split("-ep-")[0];
      
      if (id && title) {
        results.push({
          id,
          title,
          url: `${mirror}${href || ""}`,
          image: img ? (img.startsWith("http") ? img : `${mirror}${img}`) : "/placeholder.jpg",
          releaseDate: "Unknown"
        });
      }
    });

    if (results.length === 0) throw new Error(`${mirror}: Empty search`);
    SCRAPER_BASE = mirror;
    return results;
  });

  return result || [];
}

// ─── Anime Info ───────────────────────────────────────────────────────────────

export async function getAnimeInfoDirect(id: string) {
  const info = await tryAllMirrors(async (mirror) => {
    let response;
    const paths = [`/watch/${id}`, `/${id}`, `/category/${id}`];
    
    for (const path of paths) {
      try {
        response = await axios.get(`${mirror}${path}`, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(response.data);
        const title = $("h1.nv-info-title").text().trim() || $("h1").first().text().trim();
        
        // If we hit the home page or a generic page, the title will be generic
        if (title && !title.toLowerCase().includes("welcome to") && !title.toLowerCase().includes("anineko")) {
           const $ = cheerio.load(response.data);
           const info: any = {
              id,
              title,
              image: $("img.nv-info-cover").attr("src"),
              description: $("div.nv-info-description").text().trim(),
              genres: [],
              episodes: []
            };
            
            // Check if it's actually an info page by looking for description or episodes
            if (info.description || $("div.nv-info-episode-grid").length > 0) {
              console.log(`[scraper] Found Info: ${title} on ${mirror}${path}`);
              
              $("div.nv-info-genre a").each((_, el) => {
                info.genres.push($(el).text().trim());
              });

              $("div.nv-info-episode-grid a.nv-info-episode-main").each((_, el) => {
                const a = $(el);
                const href = a.attr("href");
                const numText = a.find("strong, span").first().text().replace(/[^0-9.]/g, "").trim();
                
                if (href) {
                  const ep = {
                    id: href.replace("/", ""),
                    number: parseFloat(numText) || 0,
                    url: `${mirror}${href}`
                  };
                  info.episodes.push(ep);
                }
              });

              info.episodes.sort((a: any, b: any) => a.number - b.number);
              return info;
            }
        }
      } catch (err) {
        continue;
      }
    }
    
    throw new Error(`${mirror}: Anime info not found for ${id}`);
  });

  return info;
}

// ─── Episode Sources ──────────────────────────────────────────────────────────

export async function getEpisodeSourcesDirect(episodeId: string): Promise<ScraperSource[]> {
  const sources = await tryAllMirrors(async (mirror) => {
    const { data } = await axios.get(`${mirror}/${episodeId}`, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(data);
    const sourceUrls: ScraperSource[] = [];
    
    // 1. Try to find iframes first (fallback)
    $("iframe").each((_, el) => {
      let src = $(el).attr("src") || "";
      if (src) {
        if (src.startsWith("//")) src = "https:" + src;
        if (src.includes("ads") || src.includes("pop")) return; // skip ads
        sourceUrls.push({ url: src, label: "Mirror " + (sourceUrls.length + 1), type: "iframe", isM3U8: false });
      }
    });

    // 2. Try to find raw m3u8 links in scripts (HLS)
    const scriptContent = $("script").text();
    const m3u8Regex = /(https?:\/\/[^"']+\.m3u8[^"']*)/g;
    const matches = scriptContent.match(m3u8Regex);
    if (matches) {
      matches.forEach((url, i) => {
        if (!sourceUrls.find(s => s.url === url)) {
          sourceUrls.push({ url, label: "Direct HLS " + (i + 1), type: "hls", isM3U8: true });
        }
      });
    }

    // 3. Check data-video (often encodes mirror URL)
    $("[data-video]").each((_, el) => {
      let url = $(el).attr("data-video") || "";
      if (url) {
        if (!url.startsWith("http") && !url.startsWith("//") && url.length > 20) {
          try { url = Buffer.from(url, "base64").toString(); } catch (e) {}
        }
        if (url.startsWith("//")) url = "https:" + url;
        // If relative, prepend SCRAPER_BASE
        if (url.startsWith("/")) url = SCRAPER_BASE + url;
        
        const isM3U8 = url.includes(".m3u8");
        sourceUrls.push({ 
          url, 
          label: "Server " + (sourceUrls.length + 1), 
          type: isM3U8 ? "hls" : "iframe",
          isM3U8
        });
      }
    });

    if (sourceUrls.length === 0) throw new Error(`${mirror}: No sources found`);
    return sourceUrls;
  });

  return sources || [];
}

// ─── Recent Episodes ──────────────────────────────────────────────────────────

export async function getRecentEpisodesDirect(page = 1): Promise<ScraperAnime[]> {
  const result = await tryAllMirrors(async (mirror) => {
    const { data } = await axios.get(`${mirror}/?page=${page}`, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(data);
    const results: ScraperAnime[] = [];

    // anineko recent structure: a.nv-latest-item
    $("a.nv-latest-item").each((_, el) => {
      const a = $(el);
      const title = a.find("strong").text().trim();
      const img = a.find("img").attr("src");
      const href = a.attr("href");
      
      // href is usually /watch/anime-name-episode-X or /watch/name/ep-X
      let id = href?.replace("/", "") || "";
      if (id.startsWith("watch/")) id = id.replace("watch/", "");
      
      // Remove episode suffixes like -episode-2 or /ep-2
      id = id.split("-episode-")[0].split("/ep-")[0].split("-ep-")[0];
      
      if (id && title) {
        results.push({
          id,
          title,
          url: `${mirror}${href || ""}`,
          image: img ? (img.startsWith("http") ? img : `${mirror}${img}`) : "/placeholder.jpg",
          releaseDate: "New"
        });
      }
    });

    if (results.length === 0) throw new Error(`${mirror}: No recent episodes`);
    return results;
  });

  return result || [];
}

export interface ScraperAnime {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate?: string;
}

export interface ScraperEpisode {
  id: string;
  number: number;
  url: string;
}

export interface ScraperSource {
  url: string;
  isM3U8: boolean;
  quality?: string;
  label: string;
  type: "iframe" | "hls" | "mp4";
}
