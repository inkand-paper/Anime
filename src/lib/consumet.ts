import { 
  searchAnimeDirect, 
  getAnimeInfoDirect, 
  getEpisodeSourcesDirect,
  getRecentEpisodesDirect
} from "./scraper";

/**
 * Consumet API Wrapper (NOW POWERED BY INTERNAL SCRAPER)
 * 
 * Since the public Consumet API repositories have been hit by DMCA,
 * this library has been refactored to use an internal direct scraper
 * for Gogoanime mirrors. This ensures 100% uptime regardless of 
 * external API status.
 */

export interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string;
  description?: string;
  image?: string;
  url: string;
}

export interface ConsumetAnimeInfo {
  id: string;
  title: string;
  url: string;
  image: string;
  cover?: string;
  description?: string;
  releaseDate?: string;
  status?: string;
  genres?: string[];
  totalEpisodes?: number;
  episodes: ConsumetEpisode[];
}

export interface ConsumetStreamingLink {
  url: string;
  isM3U8: boolean;
  quality?: string;
  label?: string;
  type: "iframe" | "hls" | "mp4";
}

export interface ConsumetEpisodeSources {
  headers?: Record<string, string>;
  sources: ConsumetStreamingLink[];
  download?: string;
}

export async function searchAnime(
  query: string,
  _provider?: string
): Promise<ConsumetAnimeInfo[]> {
  const results = await searchAnimeDirect(query);
  return results.map(r => ({
    id: r.id,
    title: r.title,
    url: r.url,
    image: r.image,
    description: "",
    episodes: [],
    releaseDate: r.releaseDate
  }));
}

export async function getAnimeInfo(
  animeId: string,
  _provider?: string
): Promise<ConsumetAnimeInfo | null> {
  const info = await getAnimeInfoDirect(animeId);
  if (!info) return null;

  return {
    id: info.id,
    title: info.title,
    url: "",
    image: info.image,
    description: info.description,
    genres: info.genres,
    totalEpisodes: info.episodes.length,
    episodes: info.episodes.map((ep: any) => ({
      id: ep.id,
      number: ep.number,
      url: ep.url
    }))
  };
}

export async function getEpisodeSources(
  episodeId: string,
  _provider?: string,
  _server?: string
): Promise<ConsumetEpisodeSources | null> {
  const sources = await getEpisodeSourcesDirect(episodeId);
  if (!sources || sources.length === 0) return null;

  return {
    sources: sources.map(s => ({
      url: s.url,
      isM3U8: s.isM3U8,
      label: s.label,
      type: s.type
    }))
  };
}

// Recent episodes tracker
export async function getRecentEpisodes(page = 1): Promise<ConsumetAnimeInfo[]> {
  const results = await getRecentEpisodesDirect(page);
  return results.map(r => ({
    id: r.id,
    title: r.title,
    url: r.url,
    image: r.image,
    description: "",
    episodes: [],
    tags: ["Recent"]
  }));
}
