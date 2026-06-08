"use client";

import React from "react";
import { useSubscription } from "@/context/SubscriptionContext";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { setPlan } = useSubscription();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-stone-950 border border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        {/* Left Side: Visuals */}
        <div className="md:w-1/2 relative bg-blue-600 p-12 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-white/20 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-white leading-tight">Elevate Your Anime Journey</h2>
            <div className="w-12 h-1.5 bg-white mt-6 rounded-full"></div>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-white font-bold">Priority Access</p>
                <p className="text-blue-100/70 text-sm">Watch new releases immediately without the 48-hour delay.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-white font-bold">Ad-Free Experience</p>
                <p className="text-blue-100/70 text-sm">No interruptions while watching your favorite shows.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-white font-bold">Ultra HD Streaming</p>
                <p className="text-blue-100/70 text-sm">Support for 4K and HDR on all supported titles.</p>
              </div>
            </div>
          </div>

          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-12">Anime Portal Premium</p>
        </div>

        {/* Right Side: Pricing & Action */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center gap-8">
          <div className="space-y-2">
            <p className="text-blue-500 font-bold uppercase tracking-widest text-xs">Recommended Plan</p>
            <h3 className="text-3xl font-black text-white">Choose Your Plan</h3>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => {
                setPlan("PREMIUM");
                onClose();
              }}
              className="w-full p-6 bg-zinc-900 border-2 border-blue-600 rounded-3xl flex items-center justify-between group hover:bg-zinc-800 transition-all"
            >
              <div className="text-left">
                <p className="text-white font-black text-xl">Monthly</p>
                <p className="text-zinc-500 text-sm font-medium">Billed monthly. Cancel anytime.</p>
              </div>
              <div className="text-right">
                <p className="text-blue-500 font-black text-2xl">$9.99</p>
                <p className="text-zinc-600 text-xs font-bold uppercase">/ month</p>
              </div>
            </button>

            <button 
              onClick={() => {
                setPlan("PREMIUM");
                onClose();
              }}
              className="w-full p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-between group hover:border-zinc-600 transition-all"
            >
              <div className="text-left">
                <p className="text-white font-black text-xl">Yearly</p>
                <p className="text-zinc-500 text-sm font-medium">Save 20% on annual sign-up.</p>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-2xl">$79.99</p>
                <p className="text-zinc-600 text-xs font-bold uppercase">/ year</p>
              </div>
            </button>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => {
                setPlan("PREMIUM");
                onClose();
              }}
              className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 shadow-xl shadow-white/5"
            >
              Unlock Premium Now
            </button>
            <p className="text-zinc-500 text-center text-[10px] font-bold uppercase tracking-tighter">
              Secure payment via PayPal, Google Pay & Cards.
            </p>
          </div>

          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors font-bold text-sm">
            Not now, I'll stick with the delay
          </button>
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
