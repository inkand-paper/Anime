"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { MOCK_ANIME, Anime } from "@/data/anime";
import Link from "next/link";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const filtered = MOCK_ANIME.filter(anime => 
      anime.title.English.toLowerCase().includes(query.toLowerCase()) ||
      anime.title.Japanese.toLowerCase().includes(query.toLowerCase()) ||
      anime.title.Chinese.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered.slice(0, 5));
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="container mx-auto px-6 pt-24 max-w-4xl">
        <div className="flex items-center gap-4 border-b-2 border-zinc-800 pb-4">
          <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, movies, series..."
            className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-zinc-700"
          />
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mt-12 space-y-8">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Top Results</p>
              {results.map(anime => (
                <Link 
                  key={anime.id} 
                  href={`/anime/${anime.id}`}
                  onClick={onClose}
                  className="flex items-center gap-6 p-4 rounded-2xl hover:bg-zinc-900 transition-colors group"
                >
                  <img src={anime.image} alt="" className="w-20 h-28 object-cover rounded-xl shadow-lg" />
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-500 transition-colors">{anime.title[language]}</h3>
                    <p className="text-zinc-400 text-sm mt-1">{anime.year} • {anime.rating} Rating</p>
                    <div className="flex gap-2 mt-2">
                      {anime.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] uppercase font-bold text-zinc-600 px-2 py-0.5 border border-zinc-800 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-xl font-medium">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Popular Searches</p>
                {MOCK_ANIME.slice(0, 4).map(anime => (
                  <button 
                    key={anime.id}
                    onClick={() => setQuery(anime.title.English)}
                    className="block text-left text-xl font-bold text-zinc-300 hover:text-white transition-colors"
                  >
                    {anime.title.English}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Recently Added</p>
                <div className="grid grid-cols-2 gap-4">
                  {MOCK_ANIME.slice(4, 8).map(anime => (
                    <div key={anime.id} className="relative group cursor-pointer overflow-hidden rounded-xl aspect-[16/9]">
                      <img src={anime.banner} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                        <span className="text-sm font-bold text-white line-clamp-1">{anime.title[language]}</span>
                      </div>
                    </div>
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
