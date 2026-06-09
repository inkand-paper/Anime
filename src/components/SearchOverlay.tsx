"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { MOCK_ANIME, Anime } from "@/data/anime";
import Link from "next/link";

interface SearchOverlayProps { isOpen: boolean; onClose: () => void; }

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Live letter-by-letter search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    const filtered = MOCK_ANIME.filter(
      (a) =>
        a.title.English.toLowerCase().includes(q) ||
        a.title.Japanese.toLowerCase().includes(q) ||
        a.title.Chinese.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
    setResults(filtered.slice(0, 8));
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md">
      <div className="container mx-auto px-6 pt-24 max-w-4xl">

        {/* Search input */}
        <div className="flex items-center gap-4 border-b-2 border-zinc-800 pb-4">
          <svg className="w-7 h-7 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime by title, genre..."
            className="w-full bg-transparent text-2xl lg:text-3xl font-bold text-white outline-none placeholder:text-zinc-700"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 flex-shrink-0">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-8">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4">
                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>
              {results.map((anime) => (
                <Link
                  key={anime.id}
                  href={`/watch/${anime.id}`}
                  onClick={onClose}
                  className="flex items-center gap-5 p-4 rounded-2xl hover:bg-zinc-900 transition-colors group"
                >
                  <img src={anime.image} alt="" className="w-16 h-22 object-cover rounded-xl shadow-lg flex-shrink-0" style={{ height: "5.5rem" }} />
                  <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {anime.title[language]}
                    </h3>
                    {language !== "English" && (
                      <p className="text-sm text-zinc-500 truncate">{anime.title.English}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="text-green-400 font-bold">★ {anime.rating}</span>
                      <span>•</span>
                      <span>{anime.year}</span>
                      <span>•</span>
                      <span>{anime.episodes} eps</span>
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {anime.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] uppercase font-bold text-zinc-600 px-2 py-0.5 border border-zinc-800 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-xl font-medium">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-zinc-700 text-sm mt-2">Try a different title or genre</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Popular Searches</p>
                {MOCK_ANIME.slice(0, 5).map((anime) => (
                  <button
                    key={anime.id}
                    onClick={() => setQuery(anime.title.English)}
                    className="flex items-center gap-3 text-left text-lg font-bold text-zinc-300 hover:text-white transition-colors w-full group"
                  >
                    <svg className="w-4 h-4 text-zinc-700 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    {anime.title[language]}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Recently Added</p>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_ANIME.slice(3, 7).map((anime) => (
                    <Link
                      key={anime.id}
                      href={`/watch/${anime.id}`}
                      onClick={onClose}
                      className="relative group cursor-pointer overflow-hidden rounded-xl"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <img src={anime.banner} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/50 flex items-end p-2.5">
                        <span className="text-xs font-bold text-white line-clamp-1">{anime.title[language]}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
