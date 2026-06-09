"use client";

import React from "react";
import { useWatchlist } from "@/context/WatchlistContext";
import { useLanguage } from "@/context/LanguageContext";
import AnimeCard from "@/components/AnimeCard";
import Link from "next/link";

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { language } = useLanguage();

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white">My Watchlist</h1>
          <p className="text-zinc-500 font-medium mt-1">
            {watchlist.length} {watchlist.length === 1 ? "title" : "titles"} saved
          </p>
        </div>
        {watchlist.length > 0 && (
          <Link href="/" className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition-colors">
            + Browse More
          </Link>
        )}
      </div>

      {watchlist.length > 0 ? (
        <>
          {/* Grid of cards — reuse same AnimeCard for consistency */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-5 place-items-center">
            {watchlist.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>

          {/* Clear all */}
          <div className="flex justify-center mt-14">
            <button
              onClick={() => watchlist.forEach((a) => removeFromWatchlist(a.id))}
              className="px-6 py-3 text-sm font-bold text-zinc-600 hover:text-red-400 transition-colors border border-zinc-800 hover:border-red-500/40 rounded-xl"
            >
              Clear entire watchlist
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
          <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
            <svg className="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Nothing saved yet</h2>
            <p className="text-zinc-500 max-w-sm leading-relaxed">
              Hover over any anime card and click the bookmark icon to add it to your watchlist.
            </p>
          </div>
          <Link href="/" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
            Start Exploring
          </Link>
        </div>
      )}
    </div>
  );
}
