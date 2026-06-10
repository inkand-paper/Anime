"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSubscription } from "@/context/SubscriptionContext";
import Link from "next/link";

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
      <div className="container mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white">Sign in to view your profile</h1>
        <Link href="/login" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-2xl">
      <h1 className="text-3xl font-black text-white mb-8">My Profile</h1>

      {/* User card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-xl text-3xl font-black text-white">
          {session.user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-white truncate">{session.user?.name}</h2>
          <p className="text-zinc-500 font-medium truncate">{session.user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${isPremium ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-zinc-800 text-zinc-500 border border-zinc-700"}`}>
              {isPremium ? "⭐ Premium" : "Free"}
            </span>
            {role === "ADMIN" && (
              <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-500/30">Admin</span>
            )}
          </div>
        </div>
      </div>

      {/* Referral code — M2.3 */}
      <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-7 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-black">Your Referral Code</h3>
            <p className="text-zinc-500 text-xs">Share this code — your friend gets an account, you get 2 months free Premium.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
          <code className="text-purple-300 font-mono font-black text-xl flex-1 tracking-[0.2em]">{referralCode}</code>
          <button onClick={handleCopy}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${copied ? "bg-green-600/20 text-green-400" : "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"}`}>
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Subscription */}
      {!isPremium && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7 mb-6">
          <h3 className="text-white font-black mb-1">Upgrade to Premium</h3>
          <p className="text-zinc-500 text-sm mb-5">Skip the 48-hour delay, go ad-free, watch in 4K.</p>
          <button onClick={openModal}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-black rounded-2xl transition-all transform active:scale-95">
            Unlock Premium — from $4.99/mo
          </button>
        </div>
      )}

      {/* Sign out */}
      <button onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full py-3.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 hover:text-red-400 text-zinc-400 font-bold rounded-2xl transition-all">
        Sign Out
      </button>
    </div>
  );
}
