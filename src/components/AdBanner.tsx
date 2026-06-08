"use client";

import React from "react";

export default function AdBanner() {
  return (
    <div className="w-full flex justify-center py-8">
      <div className="w-full max-w-5xl h-40 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-zinc-700 transition-colors">
        {/* Ad Background Decor */}
        <div className="absolute top-0 right-0 w-[300px] h-full bg-blue-600/5 skew-x-[-20deg] group-hover:bg-blue-600/10 transition-colors"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 px-12 text-center md:text-left">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
            <span className="text-white font-black text-2xl">A</span>
          </div>
          <div>
            <h4 className="text-xl font-black text-white">Upgrade to Premium</h4>
            <p className="text-zinc-500 font-medium text-sm">Remove all ads from the platform and watch everything in 4K.</p>
          </div>
          <button className="md:ml-auto px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-zinc-200 transition-all transform active:scale-95">
            Get 2 Months Free
          </button>
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="px-2 py-0.5 bg-zinc-800 rounded text-[8px] font-black text-zinc-500 uppercase tracking-widest">Sponsored</div>
        </div>
      </div>
    </div>
  );
}
