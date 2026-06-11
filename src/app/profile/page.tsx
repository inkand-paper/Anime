"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSubscription } from "@/context/SubscriptionContext";
import Link from "next/link";
import { 
  User, 
  ShieldCheck, 
  Gem, 
  Gift, 
  LogOut, 
  Copy, 
  Check, 
  ChevronLeft,
  Mail,
  Zap
} from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { isPremium, openModal } = useSubscription();
  const [copied, setCopied] = useState(false);

  // @ts-expect-error custom session fields
  const referralCode: string = session?.user?.referralCode ?? "Sign in to get your code";
  // @ts-expect-error custom session fields
  const role: string = session?.user?.role ?? "USER";

  const handleCopy = async () => {
    if (!session) return;
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-md text-center space-y-8 bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-12 rounded-[48px] shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-3xl border border-white/10">
            <User className="w-10 h-10 text-zinc-600" strokeWidth={1} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Access Denied</h1>
            <p className="text-zinc-500 text-sm font-medium">Please sign in to your AnimePortal account to view your profile settings.</p>
          </div>
          <Link href="/login" className="block w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 uppercase tracking-widest text-sm shadow-2xl shadow-blue-500/10">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 selection:bg-blue-500/30">
      <div className="container mx-auto px-6 max-w-2xl relative">
        {/* Background Ambience */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">My Profile</h1>
            <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2 group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Return
            </Link>
          </div>

          {/* User card */}
          <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 flex flex-col sm:flex-row items-center gap-8 shadow-2xl">
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-600 p-[2px] flex-shrink-0 shadow-2xl group relative">
              <div className="w-full h-full bg-zinc-950 rounded-[30px] flex items-center justify-center text-4xl font-black text-white overflow-hidden">
                {session.user?.name?.[0]?.toUpperCase() ?? "?"}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">{session.user?.name}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-500 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <p className="text-xs font-bold tracking-tight">{session.user?.email}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2 border shadow-lg ${isPremium ? "bg-blue-600/10 text-blue-400 border-blue-500/20" : "bg-white/5 text-zinc-500 border-white/10"}`}>
                  {isPremium ? <Gem className="w-3.5 h-3.5" /> : null}
                  {isPremium ? "Premium member" : "Free access"}
                </span>
                
                {role === "ADMIN" && (
                  <span className="text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-red-600/10 text-red-400 border border-red-500/20 flex items-center gap-2 shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    System Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Referral system */}
          <div className="bg-zinc-900/40 backdrop-blur-3xl border border-indigo-500/20 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-indigo-600/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="flex items-start gap-6 mb-8 relative z-10">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                <Gift className="w-7 h-7 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-black text-lg uppercase tracking-tight">Referral Program</h3>
                <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-sm">Share your unique code. When a friend joins, you receive <span className="text-indigo-400 font-black">2 free months</span> of Premium status.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-zinc-950/60 p-5 rounded-2xl border border-white/5 shadow-inner relative z-10 group/input focus-within:border-indigo-500/30 transition-all">
              <code className="text-indigo-300 font-mono font-black text-xl flex-1 tracking-[0.3em] ml-2">{referralCode}</code>
              <button 
                onClick={handleCopy}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-xl ${copied ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Premium Promotion */}
          {!isPremium && (
            <div className="bg-gradient-to-br from-zinc-900 to-indigo-950 border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-3 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-1">
                    <Zap className="w-3 h-3 text-blue-400 fill-blue-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Power Up</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Unlock Premium</h3>
                  <p className="text-zinc-500 text-xs font-medium max-w-[280px] mx-auto md:mx-0">Get priority access, 4K HDR streams, and zero advertisements.</p>
                </div>
                <button 
                  onClick={openModal}
                  className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3"
                >
                  Join Now
                </button>
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div className="pt-4 flex flex-col gap-4">
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full py-5 bg-zinc-900/40 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-600 hover:text-red-500 font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] group shadow-xl"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              Terminate Session
            </button>
          </div>

          <p className="text-center text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em] mt-12 pb-8">
            AnimePortal Registry System • Encrypted Node
          </p>
        </div>
      </div>
    </div>
  );
}
