"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Anime } from "@/data/anime";
import AnimeCard from "@/components/AnimeCard";
import AdBanner from "@/components/AdBanner";
import {
  TrendingUp, Flame, Star, Tv, Filter,
  ChevronLeft, ChevronRight, Search, Loader2,
} from "lucide-react";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mecha", "Music", "Mystery", "Psychological",
  "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Thriller",
];

const SORT_OPTIONS = [
  { label: "Trending",   value: "trending", Icon: TrendingUp },
  { label: "Popular",    value: "popular",  Icon: Flame },
  { label: "Top Rated",  value: "top",      Icon: Star },
  { label: "Airing Now", value: "recent",   Icon: Tv },
];

const PER_PAGE = 20;

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [animes, setAnimes]       = useState<Anime[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sortType, setSortType]   = useState(searchParams.get("type") ?? "trending");
  const [genre, setGenre]         = useState(searchParams.get("genre") ?? "");
  const [query, setQuery]         = useState(searchParams.get("q") ?? "");
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");
  const [page, setPage]           = useState(parseInt(searchParams.get("page") ?? "1", 10));
  const [hasNext, setHasNext]     = useState(false);
  const [total, setTotal]         = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchAnime = useCallback(async () => {
    setLoading(true);
    setAnimes([]);
    let url = `/api/anime/search?page=${page}&perPage=${PER_PAGE}`;
    if (query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`;
    } else if (genre) {
      url += `&genre=${encodeURIComponent(genre)}`;
    } else {
      url += `&type=${encodeURIComponent(sortType)}`;
    }
    try {
      const res = await fetch(url);
      const data = await res.json();
      setAnimes(Array.isArray(data.results) ? data.results : []);
      setHasNext(data.pageInfo?.hasNextPage ?? false);
      setTotal(data.pageInfo?.total ?? 0);
    } catch {
      setAnimes([]);
    } finally {
      setLoading(false);
    }
  }, [query, genre, sortType, page]);

  useEffect(() => { fetchAnime(); }, [fetchAnime]);

  // Sync URL params without re-triggering fetch
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    else if (genre) params.set("genre", genre);
    else params.set("type", sortType);
    if (page > 1) params.set("page", String(page));
    router.replace(`/browse?${params.toString()}`, { scroll: false });
  }, [query, genre, sortType, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (val: string) => { setSortType(val); setGenre(""); setQuery(""); setInputValue(""); setPage(1); };
  const handleGenre = (g: string) => { setGenre(g === genre ? "" : g); setQuery(""); setInputValue(""); setPage(1); };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setQuery(inputValue); setGenre(""); setPage(1); };
  const changePage = (delta: number) => { setPage((p) => Math.max(1, p + delta)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const heading = query ? `Results for "${query}"` : genre ? genre : SORT_OPTIONS.find((o) => o.value === sortType)?.label ?? "Browse";

  return (
    <div className="min-h-dvh pb-20" style={{ background: "var(--bg-base)" }}>
      <div className="container mx-auto px-4 sm:px-6 pt-6 max-w-screen-2xl space-y-6">

        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{heading}</h1>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search anime by title..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand-primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-default)")}
              />
            </div>
            <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90" style={{ background: "var(--brand-primary)" }}>
              Search
            </button>
            <button type="button" onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: filterOpen ? "var(--bg-overlay)" : "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
              <Filter size={14} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </form>

          {/* Sort tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {SORT_OPTIONS.map(({ label, value, Icon }) => (
              <button key={value} onClick={() => handleSort(value)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: sortType === value && !genre && !query ? "var(--brand-primary)" : "var(--bg-surface)",
                  color: sortType === value && !genre && !query ? "white" : "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}>
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Genre filter panel */}
          {filterOpen && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Genre</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button key={g} onClick={() => handleGenre(g)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: genre === g ? "var(--brand-primary)" : "var(--bg-elevated)",
                      color: genre === g ? "white" : "var(--text-secondary)",
                      border: `1px solid ${genre === g ? "transparent" : "var(--border-subtle)"}`,
                    }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <AdBanner variant="leaderboard" slot="browse-top" />

        {/* Results grid */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading anime...</p>
            </div>
          ) : animes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <Search size={40} style={{ color: "var(--text-muted)" }} />
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No results found</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Try a different search term or genre</p>
              </div>
            </div>
          ) : (
            <>
              {total > 0 && (
                <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
                  {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total.toLocaleString()} results
                </p>
              )}
              <div className="grid gap-x-4 gap-y-10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                {animes.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && animes.length > 0 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button onClick={() => changePage(-1)} disabled={page <= 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
              <ChevronLeft size={15} />
              Previous
            </button>
            <span className="text-sm font-semibold px-3" style={{ color: "var(--text-muted)" }}>Page {page}</span>
            <button onClick={() => changePage(1)} disabled={!hasNext}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
