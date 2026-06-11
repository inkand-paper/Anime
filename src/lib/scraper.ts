import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Internal Scraper (Replacement for DMCA'd Consumet API)
 * 
 * UPGRADED: Support for the new AniNeko.to (Gogoanime Rebrand)
 */

const ANIME_MIRRORS = [
  "https://anineko.to",
  "https://anitaku.to", // Redirects to anineko
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
    // anineko search is /browse?q=
    const url = `${mirror}/browse?q=${encodeURIComponent(query)}`;
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
    const sources: ScraperSource[] = [];

    // AniNeko uses .nv-video-server-item for server selection
    $("div.nv-video-server-item").each((_, el) => {
      const btn = $(el);
      const label = btn.text().trim();
      const url = btn.attr("data-video"); // Often stored here or in a script
      
      if (url) {
        const fullUrl = url.startsWith("https:") ? url : `https:${url}`;
        const isM3U8 = fullUrl.includes(".m3u8");
        sources.push({
          url: fullUrl,
          isM3U8,
          label: label || "Server",
          type: isM3U8 ? "hls" : "iframe"
        });
      }
    });

    // Fallback to searching all data-video attributes in the page
    if (sources.length === 0) {
      $("[data-video]").each((_, el) => {
         const url = $(el).attr("data-video");
         if (url && url.length > 10) {
            const fullUrl = url.startsWith("https:") ? url : `https:${url}`;
            const isM3U8 = fullUrl.includes(".m3u8");
            sources.push({
              url: fullUrl,
              isM3U8,
              label: "Mirror",
              type: isM3U8 ? "hls" : "iframe"
            });
         }
      });
    }

    if (sources.length === 0) throw new Error(`${mirror}: No sources found`);
    return sources;
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
