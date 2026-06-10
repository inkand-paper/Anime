"use client";

import React, { useState } from "react";
import { useSubscription } from "@/context/SubscriptionContext";

interface PremiumModalProps { isOpen: boolean; onClose: () => void; }

type BillingPlan = "monthly" | "yearly";

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { setPlan } = useSubscription();
  const [selected, setSelected] = useState<BillingPlan>("monthly");
  const [paymentStep, setPaymentStep] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => { setPaymentStep(false); setProcessing(false); onClose(); };

  const handleUnlock = async (method: string) => {
    setProcessing(true);
    // Simulate payment processing — wire to real PayPal/Google Pay SDK in M5
    await new Promise((r) => setTimeout(r, 1200));
    setPlan("PREMIUM");
    setProcessing(false);
    handleClose();
    // TODO: call POST /api/subscription with { paymentMethod: method, plan: selected }
    console.log("Payment initiated:", method, selected);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)" }}
    >
      <div className="relative w-full max-w-4xl bg-stone-950 border border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Close */}
        <button onClick={handleClose} className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white transition-colors z-10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left: features */}
        <div className="md:w-[45%] relative bg-gradient-to-br from-blue-700 to-purple-700 p-10 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-[-15%] right-[-15%] w-[280px] h-[280px] bg-white/15 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-white leading-tight">Elevate Your Anime Journey</h2>
            <div className="w-12 h-1.5 bg-white mt-5 rounded-full" />
          </div>
          <div className="relative z-10 space-y-5 mt-8">
            {[
              ["⚡", "Priority Access", "Watch new releases immediately — no 48-hour delay."],
              ["🚫", "Ad-Free", "Zero interruptions. Pure anime."],
              ["📺", "Ultra HD", "4K + HDR on all supported titles."],
              ["🎁", "Referral Rewards", "Share your code — earn free months."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-3.5">
                <span className="text-xl mt-0.5">{icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{title}</p>
                  <p className="text-blue-100/70 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="relative z-10 text-blue-200 text-xs font-bold uppercase tracking-widest mt-10">AnimePortal Premium</p>
        </div>

        {/* Right: pricing + payment */}
        <div className="md:w-[55%] p-10 flex flex-col gap-7">
          {!paymentStep ? (
            <>
              <div>
                <p className="text-blue-500 font-bold uppercase tracking-widest text-xs mb-1">Choose your plan</p>
                <h3 className="text-3xl font-black text-white">Unlock Everything</h3>
              </div>

              {/* Plan toggle */}
              <div className="space-y-3">
                {([["monthly", "$6.99", "/month", "Billed monthly. Cancel anytime.", null],
                   ["yearly",  "$4.99", "/month", "Billed $59.99/year. Save 29%.", "BEST VALUE"]] as const).map(([plan, price, unit, sub, badge]) => (
                  <button
                    key={plan}
                    onClick={() => setSelected(plan)}
                    className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all border-2 ${selected === plan ? "border-blue-600 bg-zinc-900" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900"}`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-black text-lg capitalize">{plan}</p>
                        {badge && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 uppercase tracking-wider">{badge}</span>}
                      </div>
                      <p className="text-zinc-500 text-xs font-medium mt-0.5">{sub}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-2xl ${selected === plan ? "text-blue-400" : "text-white"}`}>{price}</p>
                      <p className="text-zinc-600 text-xs font-bold uppercase">{unit}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPaymentStep(true)}
                className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 shadow-xl"
              >
                Continue to Payment
              </button>

              <button onClick={handleClose} className="text-zinc-600 hover:text-white transition-colors font-bold text-sm text-center">
                Not now
              </button>
            </>
          ) : (
            <>
              <div>
                <button onClick={() => setPaymentStep(false)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm font-bold mb-4 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </button>
                <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Select payment method</p>
                <h3 className="text-2xl font-black text-white">Pay with</h3>
              </div>

              <div className="space-y-3">
                {/* PayPal */}
                <button onClick={() => handleUnlock("paypal")} disabled={processing}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-[#003087] hover:bg-[#00256a] disabled:opacity-60 rounded-2xl transition-all transform active:scale-95 border border-[#003087]">
                  <svg className="w-6 h-6 text-[#009CDE]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.856.856 0 0 1 5.79 2.1h7.287c2.387 0 4.13.512 5.18 1.523.99.963 1.348 2.276 1.063 3.9l-.004.024v.637c-.572 3.244-2.527 5.143-5.827 5.667l-.072.012-.018.003-.004.001H10.94l-.808 4.893a.641.641 0 0 1-.633.577H7.076z"/>
                  </svg>
                  <span className="text-white font-black text-base">PayPal</span>
                  {processing && <span className="ml-auto text-blue-300 text-sm">Processing...</span>}
                </button>

                {/* Google Pay */}
                <button onClick={() => handleUnlock("googlepay")} disabled={processing}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-zinc-100 disabled:opacity-60 rounded-2xl transition-all transform active:scale-95">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-black font-black text-base">Google Pay</span>
                </button>

                {/* Card */}
                <button onClick={() => handleUnlock("card")} disabled={processing}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-60 rounded-2xl transition-all transform active:scale-95">
                  <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-white font-black text-base">Credit / Debit Card</span>
                </button>
              </div>

              <p className="text-zinc-600 text-[11px] text-center">
                🔒 Secure payment • Auto-renews • Cancel anytime
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
