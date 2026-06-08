"use client";

import React from "react";
import { Anime } from "@/data/anime";
import AnimeCard from "./AnimeCard";

interface AnimeGridProps {
  title: string;
  animes: Anime[];
}

export default function AnimeGrid({ title, animes }: AnimeGridProps) {
  return (
    <section className="py-12 space-y-6">
      <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
          <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
          {title}
        </h2>
        <button className="text-zinc-500 hover:text-white font-bold text-sm transition-colors flex items-center gap-1 uppercase tracking-widest">
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="relative">
        <div className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-6 px-6 lg:px-12 pb-12">
          {animes.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
