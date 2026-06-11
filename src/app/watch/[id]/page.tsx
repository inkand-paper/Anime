"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import VideoPlayer from "@/components/VideoPlayer";
import AdBanner from "@/components/AdBanner";
import AnimeCard from "@/components/AnimeCard";
import PremiumModal from "@/components/PremiumModal";
import { VideoSource } from "@/lib/video-resolver";
import { Anime } from "@/data/anime";
import Link from "next/link";
import { 
  ChevronLeft, 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  Tv, 
  Star, 
  Calendar,
  Lock,
  Ghost,
  Loader2,
  Share2,
  ListVideo,
  Sparkles
} from "lucide-react";

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { isPremium, isModalOpen, openModal, closeModal } = useSubscription();

  const [anime, setAnime] = useState<Anime | null>(null);
  const [animeLoading, setAnimeLoading] = useState(true);
  const [relatedAnimes, setRelatedAnimes] = useState<Anime[]>([]);
  
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState("");
  const [episode, setEpisode] = useState(1);

  // Fetch Anime details
  useEffect(() => {
    if (!id) return;
    setAnimeLoading(true);
    fetch(`/api/anime/${encodeURIComponent(id as string)}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) setAnime(data);
        else setAnime(null);
      })
      .catch(() => setAnime(null))
      .finally(() => setAnimeLoading(false));
  }, [id]);

  // Fetch Related Animes (could be a separate API, for now we fetch all and filter)
  useEffect(() => {
    fetch('/api/anime/search?q=') // empty query to get some defaults
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRelatedAnimes(data.filter(a => a.id !== id).slice(0, 6));
        }
      })
      .catch(() => {});
  }, [id]);

  // Temporarily disabled for testing - allowing all users to view content
  const isLocked = false; 
  // const isLocked = anime?.tags.includes("New Release") && !isPremium;

  // Fetch sources
  const fetchSources = useCallback(() => {
    if (!id || isLocked) return;
    setSourcesLoading(true);
    setSourcesError("");
    setSources([]);

    fetch(`/api/anime/${encodeURIComponent(id as string)}/episode/${episode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sources?.length) {
          setSources(data.sources);
        } else {
          setSourcesError("No stream detected for this episode. Our sync nodes are investigating.");
        }
      })
      .catch(() => setSourcesError("Failed to establish secure link. Check connectivity."))
      .finally(() => setSourcesLoading(false));
  }, [id, episode, isLocked]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  if (animeLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-zinc-500 font-black text-xs uppercase tracking-[0.4em] animate-pulse">Initializing Interface...</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-center gap-10">
        <div className="relative">
          <div className="absolute inset-0 bg-red-600/20 rounded-full blur-[40px]" />
          <Ghost className="w-24 h-24 text-zinc-900 relative z-10" strokeWidth={1} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Subject Lost</h1>
          <p className="text-zinc-500 max-w-sm leading-relaxed mx-auto font-medium">The anime you are looking for has been purged or never existed in the database.</p>
        </div>
        <button onClick={() => router.push("/")}
          className="px-10 py-5 bg-white text-black font-black rounded-[24px] hover:bg-zinc-200 transition-all transform active:scale-95 uppercase tracking-widest text-xs">
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 selection:bg-blue-500/30">
      <div className="container mx-auto px-6 pt-24 pb-20 space-y-12">
        {/* Breadcrumb / Back */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Home
          </Link>
          <div className="flex gap-4">
            <button className="p-3 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AdBanner slot="watch-top" />

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area */}
          <div className="lg:w-[72%] space-y-10">
            
            {/* Player Container */}
            <div className="relative">
              {isLocked ? (
                <div 
                  className="relative w-full aspect-video bg-zinc-950 rounded-[40px] overflow-hidden border border-white/5 ring-1 ring-white/10 flex flex-col items-center justify-center gap-8 cursor-pointer group shadow-2xl"
                  onClick={openModal}
                >
                  <div className="absolute inset-0 opacity-20 group-hover:scale-105 transition-transform duration-1000">
                    <img src={anime.banner} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                  </div>
                  
                  <div className="relative z-10 text-center space-y-6 px-10">
                    <div className="w-20 h-20 mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] flex items-center justify-center shadow-2xl">
                      <Lock className="w-10 h-10 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Restricted Access</h3>
                      <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                        New releases are encrypted and reserved for <span className="text-blue-500 font-bold">Premium Subscribers</span> for the first 48 hours.
                      </p>
                    </div>
                    <button className="px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20">
                      Unlock Tier Access
                    </button>
                  </div>
                </div>
              ) : sourcesLoading ? (
                <div className="w-full aspect-video bg-zinc-950 rounded-[40px] border border-white/5 flex flex-col items-center justify-center gap-6 shadow-2xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative" strokeWidth={3} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-white font-black text-xs uppercase tracking-[0.3em]">Connecting to Nodes</p>
                    <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">Scanning Dubbed & Subbed Hosts</p>
                  </div>
                </div>
              ) : sourcesError ? (
                <div className="w-full aspect-video bg-zinc-950 rounded-[40px] border border-red-500/20 flex flex-col items-center justify-center gap-6 text-center px-12 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20" />
                  <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center border border-red-500/20">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">Stream Interrupted</h3>
                    <p className="text-zinc-600 text-sm max-w-md mx-auto font-medium leading-relaxed">{sourcesError}</p>
                  </div>
                  <button onClick={fetchSources}
                    className="px-8 py-3 bg-zinc-900 text-white font-black rounded-xl border border-white/5 hover:bg-zinc-800 transition-all text-xs uppercase tracking-[0.2em] mt-4">
                    Re-attempt Sync
                  </button>
                </div>
              ) : (
                <VideoPlayer
                  sources={sources}
                  title={anime.title[language]}
                  episode={episode}
                  onNext={episode < anime.episodes ? () => setEpisode((e) => e + 1) : undefined}
                />
              )}
            </div>

            {/* Info Section */}
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                      Episode {episode}
                    </span>
                    <div className="flex gap-2">
                      {anime.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-white/5 text-zinc-500 border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">{anime.title[language]}</h1>
                  <div className="flex items-center gap-6 text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> {anime.year}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tv className="w-3.5 h-3.5" /> {anime.episodes} Seasons
                    </div>
                    <div className="flex items-center gap-2 text-green-500">
                      <Star className="w-3.5 h-3.5 fill-current" /> {anime.rating} / 10
                    </div>
                  </div>
                </div>
                
                <button className="flex items-center gap-3 px-6 py-4 bg-zinc-950 border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-zinc-700 hover:text-red-500 font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest group shadow-xl">
                  <AlertTriangle className="w-4 h-4 group-hover:animate-shake" />
                  Report Anomaly
                </button>
              </div>

              {/* Episode Selection */}
              {anime.episodes > 1 && (
                <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[40px] space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                      <ListVideo className="w-6 h-6 text-zinc-600" />
                      <h3 className="text-xl font-black text-white tracking-tight uppercase">Segment Selector</h3>
                    </div>
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                      {anime.episodes} Episodes Available
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {Array.from({ length: Math.min(anime.episodes, 100) }, (_, i) => i + 1).map((ep) => (
                      <button 
                        key={ep} 
                        onClick={() => {
                          setEpisode(ep);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`aspect-square rounded-2xl text-xs font-black transition-all flex items-center justify-center border shadow-xl
                          ${ep === episode 
                            ? "bg-blue-600 text-white border-blue-500 scale-110 z-10 shadow-blue-500/30" 
                            : "bg-white/[0.03] border-white/[0.05] text-zinc-600 hover:text-white hover:border-white/10 hover:bg-white/[0.07]"}`}
                      >
                        {ep}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-zinc-700" />
                  <h3 className="text-lg font-black text-zinc-100 uppercase tracking-tight">Intelligence Briefing</h3>
                </div>
                <p className="text-zinc-500 leading-relaxed font-medium text-sm border-l-2 border-white/5 pl-8 italic">
                  {anime.description}
                </p>
              </div>

              <AdBanner slot="watch-bottom" />

              {/* Comments Section */}
              <div className="bg-zinc-900/20 backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Nexus Discussion</h3>
                </div>
                
                <div className="relative group">
                  <textarea 
                    placeholder="Broadcast your thoughts to the community..."
                    className="w-full h-32 bg-white/[0.02] border border-white/5 rounded-[32px] p-6 text-white placeholder:text-zinc-800 focus:outline-none focus:border-blue-500/30 transition-all resize-none font-medium text-sm shadow-inner" 
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-4">
                    <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest hidden sm:block">Markdown Supported</span>
                    <button className="px-8 py-3 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 text-xs uppercase tracking-widest shadow-2xl">
                      Transmit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-[28%] space-y-12">
            <AdBanner slot="watch-sidebar" />
            
            <div className="space-y-8">
              <div className="flex items-center gap-4 px-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Correlated Media</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-12">
                {relatedAnimes.map((item) => (
                  <div key={item.id} className="relative group/side transform hover:-translate-y-2 transition-all duration-500">
                    <div className="absolute -inset-4 bg-gradient-to-b from-blue-600/10 to-purple-600/10 rounded-[40px] opacity-0 group-hover/side:opacity-100 blur-2xl transition-all duration-700 -z-10" />
                    <AnimeCard anime={item} />
                  </div>
                ))}
              </div>
              
              {relatedAnimes.length === 0 && (
                <div className="py-20 text-center border border-white/5 rounded-[40px] bg-white/[0.02] border-dashed">
                  <p className="text-zinc-700 font-black text-[10px] uppercase tracking-[0.3em]">No Correlated Media Found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PremiumModal isOpen={isModalOpen} onClose={closeModal} />
      
      {/* Decorative Background Text */}
      <div className="fixed bottom-10 left-[-5%] text-[20rem] font-black text-white/[0.01] leading-none pointer-events-none select-none uppercase tracking-tighter -z-10">
        Streaming
      </div>
    </div>
  );
}
