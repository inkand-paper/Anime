"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import SearchOverlay from "./SearchOverlay";
import WatchTogetherModal from "./WatchTogetherModal";
import { 
  Languages, 
  Search, 
  Users, 
  Globe, 
  ChevronDown, 
  Check, 
  User as UserIcon 
} from "lucide-react";

export default function Navbar() {
  const { language, setLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWatchTogetherOpen, setIsWatchTogetherOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const languages: ("English" | "Japanese" | "Chinese")[] = ["English", "Japanese", "Chinese"];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/5 py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <span className="text-white font-black text-2xl">A</span>
                <div className="absolute inset-0 bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                ANIME<span className="text-blue-500 ml-0.5">PORTAL</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-10 text-sm font-bold text-zinc-400">
              <Link href="/" className="hover:text-white transition-all transform hover:translate-y-[-1px]">Home</Link>
              <Link href="/browse" className="hover:text-white transition-all transform hover:translate-y-[-1px]">Browse</Link>
              <Link href="/watchlist" className="hover:text-white transition-all transform hover:translate-y-[-1px]">Watchlist</Link>
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-6">

            {/* Social community buttons */}
            <div className="hidden lg:flex items-center gap-4 border-r border-white/5 pr-6 mr-1">
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer"
                title="Join our Discord"
                className="p-2.5 rounded-xl transition-all hover:bg-blue-600/10 text-zinc-400 hover:text-blue-400 border border-transparent hover:border-blue-600/20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              </a>
              <a href="https://reddit.com" target="_blank" rel="noopener noreferrer"
                title="Join our Reddit"
                className="p-2.5 rounded-xl transition-all hover:bg-orange-600/10 text-zinc-400 hover:text-orange-500 border border-transparent hover:border-orange-600/20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
              </a>
            </div>

            {/* Watch Together */}
            <button
              onClick={() => setIsWatchTogetherOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <Users className="w-4 h-4" />
              Watch Together
            </button>

            {/* Search */}
            <button onClick={() => setIsSearchOpen(true)} className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Search">
              <Search className="w-6 h-6" />
            </button>

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="px-4 py-2.5 bg-zinc-900/50 border border-white/5 rounded-2xl text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 transition-all flex items-center gap-3"
              >
                <Languages className="w-4 h-4 text-blue-500" />
                <span className="uppercase tracking-widest">{language.substring(0, 3)}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isLangOpen ? "rotate-180" : ""}`} />
              </button>
              {isLangOpen && (
                <div className="absolute top-full right-0 mt-3 w-44 bg-zinc-950 border border-white/5 rounded-[24px] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 mb-1 border-b border-white/5">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Select Language</span>
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => { setLanguage(lang); setIsLangOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 transition-all ${language === lang ? "text-blue-500 bg-blue-500/5" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <Globe className={`w-4 h-4 ${language === lang ? "opacity-100" : "opacity-0"}`} />
                      <span className="font-bold">{lang}</span>
                      {language === lang && <Check className="ml-auto w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <Link href="/login" className="w-11 h-11 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden hover:border-blue-500 hover:bg-zinc-800 transition-all shadow-inner" title="Sign in">
              <UserIcon className="w-6 h-6 text-zinc-500" />
            </Link>
          </div>
        </div>
      </nav>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <WatchTogetherModal isOpen={isWatchTogetherOpen} onClose={() => setIsWatchTogetherOpen(false)} />
    </>
  );
}
