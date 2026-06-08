"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { Anime } from "@/data/anime";

interface HeroProps {
  anime: Anime;
}

export default function Hero({ anime }: HeroProps) {
  const { language } = useLanguage();
  const { addToWatchlist, isInWatchlist } = useWatchlist();

  const isAdded = isInWatchlist(anime.id);

  return (
    <div className="relative w-full h-[85vh] lg:h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Gradient Mask */}
      <div className="absolute inset-0 z-0">
        <img 
          src={anime.banner} 
          alt={anime.title[language]} 
          className="w-full h-full object-cover object-top scale-105 animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-2xl space-y-6">
          {/* Metadata badges */}
          <div className="flex items-center gap-3 text-sm font-bold tracking-wider">
            <span className="text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase">New Release</span>
            <span className="text-zinc-300">{anime.year}</span>
            <span className="text-zinc-300">{anime.episodes} Episodes</span>
            <span className="text-green-500">{anime.rating} Rating</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight break-words">
            {anime.title[language]}
          </h1>

          {/* Description */}
          <p className="text-lg text-zinc-300 line-clamp-3 leading-relaxed max-w-xl">
            {anime.description}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all transform active:scale-95 flex items-center gap-2 text-lg shadow-xl shadow-white/10">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Watch Now
            </button>
            <button 
              onClick={() => addToWatchlist(anime)}
              disabled={isAdded}
              className={`px-8 py-4 rounded-xl border font-bold transition-all transform active:scale-95 flex items-center gap-2 text-lg ${isAdded ? 'bg-zinc-800 border-zinc-700 text-green-500' : 'bg-zinc-800/80 backdrop-blur-md text-white border-zinc-700 hover:bg-zinc-700'}`}
            >
              {isAdded ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              )}
              {isAdded ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 pt-2">
            {anime.tags.map(tag => (
              <span key={tag} className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 border border-zinc-800 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s linear infinite alternate;
        }
      `}</style>
    </div>
  );
}
