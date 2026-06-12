/**
 * AniList GraphQL API client
 * Free, no API key required, 15,000+ anime titles.
 * Rate limit: 90 requests/minute (auto-throttled here).
 * Docs: https://anilist.gitbook.io/anilist-apiv2-docs
 */

const ANILIST_API = "https://graphql.anilist.co";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AniListTitle {
  romaji: string;
  english: string | null;
  native: string;
}

export interface AniListCoverImage {
  extraLarge: string;
  large: string;
  medium: string;
  color: string | null;
}

export interface AniListAnime {
  id: number;
  idMal: number | null;
  title: AniListTitle;
  description: string | null;
  coverImage: AniListCoverImage;
  bannerImage: string | null;
  averageScore: number | null;
  popularity: number;
  episodes: number | null;
  duration: number | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  genres: string[];
  tags: { name: string; rank: number }[];
  studios: { nodes: { name: string }[] };
  trailer: { id: string; site: string } | null;
  format: string;
  isAdult: boolean;
}

export interface AniListPage {
  pageInfo: { total: number; currentPage: number; hasNextPage: boolean };
  media: AniListAnime[];
}

// ─── Core query executor ──────────────────────────────────────────────────────

async function query<T>(
  gql: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: gql, variables }),
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (res.status === 429) {
    // Rate limited — wait and retry once
    await new Promise((r) => setTimeout(r, 2000));
    return query<T>(gql, variables);
  }

  if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Fragment ────────────────────────────────────────────────────────────────

const MEDIA_FRAGMENT = `
  id idMal
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge large medium color }
  bannerImage
  averageScore popularity episodes duration
  status season seasonYear
  startDate { year month day }
  genres
  tags { name rank }
  studios(isMain: true) { nodes { name } }
  trailer { id site }
  format isAdult
`;

// ─── Trending / Popular ───────────────────────────────────────────────────────

export async function getTrending(page = 1, perPage = 20): Promise<AniListPage> {
  const data = await query<{ Page: AniListPage }>(
    `query($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        pageInfo{total currentPage hasNextPage}
        media(type:ANIME,sort:TRENDING_DESC,isAdult:false,status_in:[RELEASING,FINISHED]){${MEDIA_FRAGMENT}}
      }
    }`,
    { page, perPage }
  );
  return data.Page;
}

export async function getPopular(page = 1, perPage = 20): Promise<AniListPage> {
  const data = await query<{ Page: AniListPage }>(
    `query($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        pageInfo{total currentPage hasNextPage}
        media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){${MEDIA_FRAGMENT}}
      }
    }`,
    { page, perPage }
  );
  return data.Page;
}

export async function getTopRated(page = 1, perPage = 20): Promise<AniListPage> {
  const data = await query<{ Page: AniListPage }>(
    `query($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        pageInfo{total currentPage hasNextPage}
        media(type:ANIME,sort:SCORE_DESC,isAdult:false,averageScore_greater:70){${MEDIA_FRAGMENT}}
      }
    }`,
    { page, perPage }
  );
  return data.Page;
}

export async function getRecentlyAired(page = 1, perPage = 20): Promise<AniListPage> {
  const data = await query<{ Page: AniListPage }>(
    `query($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        pageInfo{total currentPage hasNextPage}
        media(type:ANIME,sort:UPDATED_AT_DESC,status:RELEASING,isAdult:false){${MEDIA_FRAGMENT}}
      }
    }`,
    { page, perPage }
  );
  return data.Page;
}

export async function getByGenre(
  genre: string,
  page = 1,
  perPage = 20
): Promise<AniListPage> {
  const data = await query<{ Page: AniListPage }>(
    `query($page:Int,$perPage:Int,$genre:String){
      Page(page:$page,perPage:$perPage){
        pageInfo{total currentPage hasNextPage}
        media(type:ANIME,genre:$genre,sort:POPULARITY_DESC,isAdult:false){${MEDIA_FRAGMENT}}
      }
    }`,
    { page, perPage, genre }
  );
  return data.Page;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAniList(
  search: string,
  page = 1,
  perPage = 20
): Promise<AniListPage> {
  const data = await query<{ Page: AniListPage }>(
    `query($search:String,$page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        pageInfo{total currentPage hasNextPage}
        media(type:ANIME,search:$search,isAdult:false,sort:SEARCH_MATCH){${MEDIA_FRAGMENT}}
      }
    }`,
    { search, page, perPage }
  );
  return data.Page;
}

// ─── Single anime ─────────────────────────────────────────────────────────────

export async function getAnimeById(id: number): Promise<AniListAnime | null> {
  try {
    const data = await query<{ Media: AniListAnime }>(
      `query($id:Int){
        Media(id:$id,type:ANIME){${MEDIA_FRAGMENT}}
      }`,
      { id }
    );
    return data.Media;
  } catch {
    return null;
  }
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export async function getRecommendations(
  animeId: number,
  perPage = 8
): Promise<AniListAnime[]> {
  try {
    const data = await query<{
      Media: { recommendations: { nodes: { mediaRecommendation: AniListAnime }[] } };
    }>(
      `query($id:Int,$perPage:Int){
        Media(id:$id){
          recommendations(perPage:$perPage,sort:RATING_DESC){
            nodes{ mediaRecommendation{${MEDIA_FRAGMENT}} }
          }
        }
      }`,
      { id: animeId, perPage }
    );
    return data.Media.recommendations.nodes
      .map((n) => n.mediaRecommendation)
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Helper: normalize to a flat object ──────────────────────────────────────

export function normalizeAnime(a: AniListAnime) {
  return {
    id: String(a.id),
    malId: a.idMal ? String(a.idMal) : null,
    title: {
      English: a.title.english ?? a.title.romaji,
      Japanese: a.title.native,
      Chinese: a.title.romaji, // AniList has no Chinese title field
      Romaji: a.title.romaji,
    },
    image: a.coverImage.extraLarge ?? a.coverImage.large ?? "",
    banner: a.bannerImage ?? a.coverImage.extraLarge ?? a.coverImage.large ?? "",
    rating: a.averageScore ? (a.averageScore / 10).toFixed(1) : "N/A",
    year: String(a.seasonYear ?? a.startDate.year ?? ""),
    episodes: a.episodes ?? 0,
    description: a.description?.replace(/<[^>]+>/g, "") ?? "",
    tags: a.genres.slice(0, 5),
    status: a.status,
    studios: a.studios.nodes.map((s) => s.name),
    format: a.format,
    color: a.coverImage.color ?? "#3b82f6",
  };
}

export type NormalizedAnime = ReturnType<typeof normalizeAnime>;
