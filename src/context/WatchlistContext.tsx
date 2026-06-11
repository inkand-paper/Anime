"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Anime } from "@/data/anime";

interface WatchlistContextType {
  watchlist: Anime[];
  addToWatchlist: (anime: Anime) => void;
  removeFromWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<Anime[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("anistream_watchlist_v2");
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  const persist = (list: Anime[]) => {
    setWatchlist(list);
    try { localStorage.setItem("anistream_watchlist_v2", JSON.stringify(list)); } catch {}
  };

  const addToWatchlist = (anime: Anime) => {
    if (!watchlist.find((a) => a.id === anime.id)) persist([...watchlist, anime]);
  };

  const removeFromWatchlist = (id: string) => {
    persist(watchlist.filter((a) => a.id !== id));
  };

  const isInWatchlist = (id: string) => watchlist.some((a) => a.id === id);

  // Don't render watchlist UI until hydrated to avoid SSR mismatch
  if (!hydrated) {
    return (
      <WatchlistContext.Provider
        value={{ watchlist: [], addToWatchlist: () => {}, removeFromWatchlist: () => {}, isInWatchlist: () => false }}
      >
        {children}
      </WatchlistContext.Provider>
    );
  }

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider");
  return ctx;
}
