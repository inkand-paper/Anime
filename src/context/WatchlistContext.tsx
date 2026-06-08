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

  useEffect(() => {
    const saved = localStorage.getItem("anime_watchlist");
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse watchlist", e);
      }
    }
  }, []);

  const save = (list: Anime[]) => {
    setWatchlist(list);
    localStorage.setItem("anime_watchlist", JSON.stringify(list));
  };

  const addToWatchlist = (anime: Anime) => {
    if (!watchlist.find(a => a.id === anime.id)) {
      save([...watchlist, anime]);
    }
  };

  const removeFromWatchlist = (id: string) => {
    save(watchlist.filter(a => a.id !== id));
  };

  const isInWatchlist = (id: string) => {
    return !!watchlist.find(a => a.id === id);
  };

  return (
    <LanguageProvider_Wrapper>
        <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
        {children}
        </WatchlistContext.Provider>
    </LanguageProvider_Wrapper>
  );
}

// Helper to keep context clean
function LanguageProvider_Wrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
