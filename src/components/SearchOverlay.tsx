"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Search, X, Loader2, Star, ChevronRight } from "lucide-react";
import { Anime } from "@/data/anime";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { language } = useLanguage();
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);
  const abortRef              = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Escape closes
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  // Live search — debounced 300ms
  const doSearch = useCallback(async (q: string) => {
    abortRef.current?.abort();
    if (!q.trim()) { setResults([]); setLoading(false); return; }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/anime/search?q=${encodeURIComponent(q)}&perPage=8`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Normalize shape — API returns normalizeAnime() output
      const items: Anime[] = (data.results ?? []).map((r: Anime) => ({
        ...r,
        title: typeof r.title === "string"
          ? { English: r.title, Japanese: r.title, Chinese: r.title, Romaji: r.title }
          : r.title,
      }));
      setResults(items);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  if (!isOpen) return null;

  const getTitle = (anime: Anime) => {
    const t = anime.title;
    if (!t || typeof t !== "object") return String(anime.id);
    return t[language as keyof typeof t] ?? t.English ?? t.Romaji ?? String(anime.id);
  };

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{ background: "rgba(3,7,18,0.94)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="container mx-auto px-4 sm:px-6 pt-20 max-w-3xl">

        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          {loading
            ? <Loader2 size={20} className="animate-spin shrink-0" style={{ color: "var(--text-muted)" }} />
            : <Search size={20} className="shrink-0" style={{ color: "var(--text-muted)" }} />}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime by title, genre..."
            className="flex-1 bg-transparent text-lg font-medium outline-none"
            style={{ color: "var(--text-primary)" }}
            aria-label="Search anime"
          />
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button onClick={() => setQuery("")} className="transition-colors hover:text-white" style={{ color: "var(--text-muted)" }} aria-label="Clear">
                <X size={16} />
              </button>
            )}
            <button onClick={onClose}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              Esc
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            {results.map((anime, i) => (
              <Link
                key={anime.id}
                href={`/watch/${anime.id}`}
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5 group"
                style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}
              >
                {/* Thumbnail */}
                <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-elevated)" }}>
                  {anime.image && (
                    <img src={anime.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-white transition-colors" style={{ color: "var(--text-primary)" }}>
                    {getTitle(anime)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {anime.rating && anime.rating !== "N/A" && (
                      <span className="flex items-center gap-0.5 text-xs">
                        <Star size={10} fill="#f59e0b" color="#f59e0b" />
                        {anime.rating}
                      </span>
                    )}
                    {anime.year && <span className="text-xs">{anime.year}</span>}
                    {anime.episodes > 0 && <span className="text-xs">{anime.episodes} ep</span>}
                  </div>
                </div>

                {/* Tags */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  {anime.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <ChevronRight size={14} className="shrink-0 transition-colors group-hover:text-white" style={{ color: "var(--text-muted)" }} />
              </Link>
            ))}

            {/* View all results link */}
            {query.trim() && (
              <Link
                href={`/browse?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
                style={{
                  color: "var(--brand-primary)",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                View all results for &ldquo;{query}&rdquo;
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        ) : query && !loading ? (
          <div className="text-center py-16">
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Try a different search term</p>
          </div>
        ) : !query ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Start typing to search 10,000+ anime titles
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
