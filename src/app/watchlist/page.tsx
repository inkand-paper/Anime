"use client";

import React from "react";
import Link from "next/link";
import { useWatchlist } from "@/context/WatchlistContext";
import { useLanguage } from "@/context/LanguageContext";
import AnimeCard from "@/components/AnimeCard";
import { Bookmark, TrendingUp, Trash2 } from "lucide-react";

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { language } = useLanguage();

  return (
    <div className="min-h-dvh pb-20" style={{ background: "var(--bg-base)" }}>
      <div className="container mx-auto px-4 sm:px-6 pt-8 max-w-screen-2xl">

        {/* Header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              <Bookmark size={18} style={{ color: "var(--brand-primary)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                My Watchlist
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {watchlist.length} {watchlist.length === 1 ? "title" : "titles"} saved
              </p>
            </div>
          </div>

          {watchlist.length > 0 && (
            <button
              onClick={() => watchlist.forEach((a) => removeFromWatchlist(a.id))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-red-500/10 hover:text-red-400"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Trash2 size={14} />
              Clear all
            </button>
          )}
        </div>

        {watchlist.length > 0 ? (
          <div
            className="grid gap-x-4 gap-y-10"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
          >
            {watchlist.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              <Bookmark size={32} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Your watchlist is empty
              </h2>
              <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
                Hover over any anime card and click Save to add it here for quick access.
              </p>
            </div>
            <Link
              href="/browse"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "var(--brand-primary)" }}
            >
              <TrendingUp size={16} />
              Discover Anime
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
