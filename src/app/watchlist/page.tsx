"use client";

import React from "react";
import { useWatchlist } from "@/context/WatchlistContext";
import { useLanguage } from "@/context/LanguageContext";
import AnimeCard from "@/components/AnimeCard";
import Link from "next/link";
import { Bookmark, Sparkles, ChevronLeft, Trash2, Plus } from "lucide-react";

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 selection:bg-blue-500/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2 group mb-4">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Storefront
            </Link>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">My Watchlist</h1>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
                {watchlist.length} {watchlist.length === 1 ? "Selected Title" : "Selected Titles"}
              </p>
            </div>
          </div>
          
          {watchlist.length > 0 && (
            <Link href="/browse" className="px-6 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-white hover:border-white/20 transition-all uppercase tracking-[0.2em] flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Discover More
            </Link>
          )}
        </div>

        {watchlist.length > 0 ? (
          <div className="space-y-16 animate-in fade-in duration-700">
            {/* Grid of cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-12 gap-x-6">
              {watchlist.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>

            {/* Clear all */}
            <div className="flex flex-col items-center gap-4 pt-10 border-t border-white/5">
              <button
                onClick={() => {
                  if (confirm("Permanently clear your entire watchlist?")) {
                    watchlist.forEach((a) => removeFromWatchlist(a.id));
                  }
                }}
                className="group flex items-center gap-3 px-8 py-3.5 text-[10px] font-black text-zinc-600 hover:text-red-500 transition-all border border-white/5 hover:border-red-500/20 rounded-2xl bg-white/[0.01] hover:bg-red-500/5 uppercase tracking-[0.3em]"
              >
                <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Flush Watchlist
              </button>
              <p className="text-[10px] text-zinc-800 font-bold uppercase tracking-widest italic">
                Local Session Cache • 0.04ms Operation
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-10 animate-in zoom-in-95 duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-[40px] animate-pulse" />
              <div className="relative w-28 h-28 bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[32px] flex items-center justify-center shadow-2xl">
                <Bookmark className="w-12 h-12 text-zinc-700" strokeWidth={1} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Void Detected</h2>
              <p className="text-zinc-500 max-w-sm leading-relaxed font-medium mx-auto">
                Your library is currently empty. Bookmark titles while browsing to curate your personal collection.
              </p>
            </div>
            
            <Link href="/" className="group relative px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-white hover:scale-105 transition-all text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Launch Explorer
            </Link>
          </div>
        )}
      </div>

      {/* Decorative text */}
      <div className="absolute bottom-10 right-[-2%] text-[12rem] font-black text-white/[0.02] leading-none pointer-events-none select-none uppercase tracking-tighter">
        Vault
      </div>
    </div>
  );
}
