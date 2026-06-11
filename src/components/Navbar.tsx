"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search, Globe, ChevronDown, LogIn, LogOut,
  User, Bookmark, LayoutDashboard, Users, Menu, X,
  MessageCircle, Send, Github,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import SearchOverlay from "./SearchOverlay";
import WatchTogetherModal from "./WatchTogetherModal";
import { cn } from "@/lib/cn";

type Language = "English" | "Japanese" | "Chinese";

const LANG_OPTIONS: { value: Language; label: string; short: string }[] = [
  { value: "English",  label: "English",  short: "EN" },
  { value: "Japanese", label: "日本語",   short: "JA" },
  { value: "Chinese",  label: "中文",     short: "ZH" },
];

const SOCIAL = [
  { label: "Discord",  href: "https://discord.com",    Icon: MessageCircle },
  { label: "Telegram", href: "https://t.me",           Icon: Send },
  { label: "GitHub",   href: "https://github.com",     Icon: Github },
];

const NAV_LINKS = [
  { label: "Home",    href: "/" },
  { label: "Browse",  href: "/browse" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { language, setLanguage } = useLanguage();
  const { openModal, isPremium } = useSubscription();

  const [scrolled, setScrolled]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [watchOpen, setWatchOpen]       = useState(false);
  const [langOpen, setLangOpen]         = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);

  const langRef    = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // @ts-expect-error custom session field
  const role: string = session?.user?.role ?? "USER";
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current    && !langRef.current.contains(e.target as Node))    setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const currentLang = LANG_OPTIONS.find((l) => l.value === language) ?? LANG_OPTIONS[0];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b"
            : "border-b border-transparent"
        )}
        style={{
          background: scrolled ? "rgba(3,7,18,0.92)" : "linear-gradient(to bottom, rgba(3,7,18,0.8), transparent)",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderColor: scrolled ? "var(--border-subtle)" : "transparent",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-base"
              style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}
            >
              A
            </div>
            <span className="text-lg font-black tracking-tight hidden sm:block" style={{ color: "var(--text-primary)" }}>
              AniStream
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                  pathname === href
                    ? "text-white bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">

            {/* Social community — desktop only */}
            <div className="hidden lg:flex items-center gap-1 pr-2 mr-1 border-r" style={{ borderColor: "var(--border-subtle)" }}>
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>

            {/* Watch Together */}
            <button
              onClick={() => setWatchOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
              style={{
                background: "rgba(139,92,246,0.12)",
                color: "#a78bfa",
                border: "1px solid rgba(139,92,246,0.25)",
              }}
            >
              <Users size={13} />
              <span className="hidden md:inline">Watch Together</span>
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
              style={{ color: "var(--text-secondary)" }}
            >
              <Search size={17} />
            </button>

            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Globe size={13} />
                <span>{currentLang.short}</span>
                <ChevronDown size={11} className={cn("transition-transform", langOpen && "rotate-180")} />
              </button>
              {langOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-36 rounded-xl py-1.5 shadow-xl animate-scale-in"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                >
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setLanguage(opt.value); setLangOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-white/5"
                      style={{ color: language === opt.value ? "var(--brand-primary)" : "var(--text-secondary)" }}
                    >
                      <span className="font-medium">{opt.label}</span>
                      {language === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand-primary)" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile / Auth */}
            {session ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl transition-colors hover:bg-white/10"
                  style={{ border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}
                  >
                    {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  {isPremium && (
                    <span
                      className="hidden sm:inline text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{ background: "rgba(59,130,246,0.2)", color: "var(--brand-primary)" }}
                    >
                      Pro
                    </span>
                  )}
                  <ChevronDown size={12} className={cn("transition-transform", profileOpen && "rotate-180")} style={{ color: "var(--text-muted)" }} />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl py-1.5 shadow-xl animate-scale-in"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                  >
                    <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {session.user?.name}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {session.user?.email}
                      </p>
                    </div>

                    {[
                      { label: "Profile",   href: "/profile",   Icon: User },
                      { label: "Watchlist", href: "/watchlist", Icon: Bookmark },
                      ...(isAdmin ? [{ label: "Admin Panel", href: "/admin", Icon: LayoutDashboard }] : []),
                    ].map(({ label, href, Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Icon size={14} />
                        {label}
                      </Link>
                    ))}

                    {!isPremium && (
                      <button
                        onClick={() => { openModal(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold transition-colors"
                        style={{ color: "var(--brand-primary)" }}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}
                        />
                        Upgrade to Premium
                      </button>
                    )}

                    <div className="border-t my-1" style={{ borderColor: "var(--border-subtle)" }} />
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
                  color: "white",
                }}
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t px-4 py-4 space-y-1"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  pathname === href ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => { setWatchOpen(true); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-violet-400 hover:bg-white/5 transition-colors"
            >
              <Users size={14} />
              Watch Together
            </button>
            <div className="flex gap-2 pt-2">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <WatchTogetherModal isOpen={watchOpen} onClose={() => setWatchOpen(false)} />
    </>
  );
}
