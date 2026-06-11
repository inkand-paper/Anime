"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Anime } from "@/data/anime";
import Link from "next/link";
import { Loader2, Search, X, ChevronRight } from "lucide-react";

interface SearchOverlayProps { isOpen: boolean; onClose: () => void; }

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  // Live search with API
  useEffect(() => {
    if (!query.trim()) { 
      setResults([]); 
      setLoading(false);
      return; 
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/anime/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = await res.json();
        if (data.results) {
          // Map results to UI shape if needed (though API should return correct shape)
          setResults(data.results.map((r: any) => ({
            id: r.id,
            title: typeof r.title === 'string' ? { English: r.title, Japanese: r.title, Chinese: r.title } : r.title,
            image: r.image,
            banner: r.banner || r.image,
            rating: String(r.rating || "N/A"),
            year: r.year || "—",
            episodes: r.totalEpisodes || r.episodes || 0,
            tags: r.genres || r.tags || [],
            description: r.description || ""
          })));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="container mx-auto px-6 pt-24 max-w-4xl">

        {/* Search input */}
        <div className="flex items-center gap-4 border-b-2 border-zinc-800 pb-4">
          <Search className="w-7 h-7 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime..."
            className="w-full bg-transparent text-2xl lg:text-3xl font-bold text-white outline-none placeholder:text-zinc-700"
          />
          {loading && <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />}
          {query && !loading && (
            <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0">
              <X className="w-6 h-6" />
            </button>
          )}
          <button onClick={onClose} className="ml-4 p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 flex-shrink-0">
             <X className="w-7 h-7" />
          </button>
        </div>

        <div className="mt-8 overflow-y-auto max-h-[70vh] pr-4 custom-scrollbar">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4">
                Found {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((anime) => (
                <Link
                  key={anime.id}
                  href={`/watch/${anime.id}`}
                  onClick={onClose}
                  className="flex items-center gap-5 p-4 rounded-2xl hover:bg-zinc-900 transition-colors group border border-transparent hover:border-white/5"
                >
                  <img src={anime.image} alt="" className="w-16 h-22 object-cover rounded-xl shadow-lg flex-shrink-0" style={{ height: "5.5rem" }} />
                  <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {anime.title[language]}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="text-emerald-400 font-bold">★ {anime.rating}</span>
                      <span>•</span>
                      <span>{anime.year}</span>
                      <span>•</span>
                      <span>{anime.episodes} EP</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : query && !loading ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-xl font-medium">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-zinc-700 text-sm mt-2">Try a different title or genre</p>
            </div>
          ) : !query && (
            <div className="py-20 text-center">
              <p className="text-zinc-700 font-black text-xs uppercase tracking-[0.4em]">Type to Search the Multiverse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
