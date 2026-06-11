"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

type AdBannerVariant = "leaderboard" | "sidebar" | "banner";

interface AdBannerProps {
  variant?: AdBannerVariant;
  slot?: string;
  className?: string;
}

const AD_PLACEHOLDER_COPY = [
  { headline: "Upgrade to Premium", sub: "Watch new episodes 48h early. Ad-free. 4K HDR.", cta: "Try Free →", color: "from-blue-600 to-purple-600" },
  { headline: "Anime Merch Store", sub: "Official posters, figures, and apparel. Limited edition drops.", cta: "Shop Now →", color: "from-pink-600 to-orange-500" },
  { headline: "Join our Discord", sub: "10,000+ anime fans. Discuss, share, and discover.", cta: "Join Free →", color: "from-indigo-600 to-blue-500" },
];

const dims: Record<AdBannerVariant, { w: string; h: string; label: string }> = {
  leaderboard: { w: "w-full", h: "h-[90px]",  label: "728×90 Leaderboard" },
  sidebar:     { w: "w-full", h: "h-[250px]", label: "300×250 Medium Rectangle" },
  banner:      { w: "w-full", h: "h-[60px]",  label: "468×60 Banner" },
};

export default function AdBanner({ variant = "leaderboard", className = "" }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const ad = AD_PLACEHOLDER_COPY[Math.floor(Math.random() * AD_PLACEHOLDER_COPY.length)];
  const { w, h, label } = dims[variant];

  if (dismissed) return null;

  return (
    <div className={`${w} ${h} ${className} relative overflow-hidden rounded-xl border border-zinc-800 flex items-center`}>
      {/* Ad content */}
      <div className={`absolute inset-0 bg-gradient-to-r ${ad.color} opacity-10`} />
      <div className="relative flex items-center justify-between w-full px-5 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest shrink-0 border border-zinc-700 px-1.5 py-0.5 rounded">Ad</span>
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate">{ad.headline}</p>
            {variant !== "banner" && (
              <p className="text-xs text-zinc-500 truncate">{ad.sub}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a href="#" className={`text-xs font-black px-4 py-2 rounded-lg bg-gradient-to-r ${ad.color} text-white whitespace-nowrap hover:opacity-90 transition-opacity`}>
            {ad.cta}
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-zinc-700 hover:text-zinc-400 transition-colors rounded-lg hover:bg-white/5"
            title="Close ad"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Size label (dev mode) */}
      {process.env.NODE_ENV === "development" && (
        <span className="absolute bottom-1 right-2 text-[8px] text-zinc-700 font-mono">{label}</span>
      )}
    </div>
  );
}
