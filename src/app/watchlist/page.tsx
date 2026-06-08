"use client";

import React from "react";
import { useWatchlist } from "@/context/WatchlistContext";
import AnimeCard from "@/components/AnimeCard";

export default function WatchlistPage() {
  const { watchlist } = useWatchlist();

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl font-black text-white">My Watchlist</h1>
        <p className="text-zinc-500 font-medium">You have {watchlist.length} animes saved for later.</p>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-12 gap-x-6">
          {watchlist.map((anime) => (
            <div key={anime.id} className="flex justify-center">
                <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
          <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
            <svg className="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Your watchlist is empty</h2>
            <p className="text-zinc-500 max-w-sm">Explore our collection and add your favorite animes to keep track of them.</p>
          </div>
          <a href="/" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
            Start Exploring
          </a>
        </div>
      )}
    </div>
  );
}
